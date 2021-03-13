import datetime
import hashlib
import os
import shutil
import tempfile
import uuid
from contextlib import contextmanager
from unittest import mock
from unittest.mock import MagicMock

from django.conf import settings
from django.test import TestCase, override_settings
from django.utils import timezone

from documents.consumer import ConsumerError
from documents.merge import PdfCache, MergeError, execute_split_merge_plan, consume_many_files, parse_page_list
from documents.models import Document, Correspondent, Tag, DocumentType
from documents.tests.utils import DirectoriesMixin


class TestPdfCache(DirectoriesMixin, TestCase):

    def setUp(self) -> None:
        super(TestPdfCache, self).setUp()
        self.cache = PdfCache()

    def test_open_no_pdf(self):
        doc = Document.objects.create(mime_type="image/jpeg")
        self.assertRaisesMessage(MergeError, "does not have PDF.", self.cache.open_from_document, doc)

    def test_open_original_pdf(self):
        doc = Document.objects.create(mime_type="application/pdf", filename="test.pdf")
        shutil.copy(os.path.join(os.path.dirname(__file__), "samples", "simple.pdf"), doc.source_path)
        self.cache.open_from_document(doc)
        self.assertIn(doc.pk, self.cache.cache)

    def test_document_does_not_exist(self):
        doc = Document.objects.create(mime_type="application/pdf", filename="test.pdf")
        self.assertRaisesMessage(MergeError, "does not exist.", self.cache.open_from_document, doc)

    def test_open_archive_pdf(self):
        doc = Document.objects.create(mime_type="image/jpef", archive_checksum="B", archive_filename="test.pdf")
        shutil.copy(os.path.join(os.path.dirname(__file__), "samples", "simple.pdf"), doc.archive_path)
        self.cache.open_from_document(doc)
        self.assertIn(doc.pk, self.cache.cache)

    @mock.patch("documents.merge.Pdf.open")
    def test_cached(self, pdf_open: MagicMock):
        pdf_open.return_value = "the_pdf"
        doc = Document.objects.create(mime_type="application/pdf", filename="test.pdf")
        shutil.copy(os.path.join(os.path.dirname(__file__), "samples", "simple.pdf"), doc.source_path)
        self.assertEqual(self.cache.open_from_document(doc), "the_pdf")
        pdf_open.assert_called_once()
        self.assertIn(doc.pk, self.cache.cache)

        pdf_open.reset_mock()
        self.assertEqual(self.cache.open_from_document(doc), "the_pdf")
        pdf_open.assert_not_called()

    def test_close(self):
        self.test_open_original_pdf()

        self.assertEqual(len(self.cache.cache), 1)

        self.cache.close_all()

        self.assertEqual(len(self.cache.cache), 0)


class TestParsePageList(TestCase):

    def test_ranges(self):
        self.assertListEqual(parse_page_list(""), [])
        self.assertListEqual(parse_page_list(None), [])
        self.assertListEqual(parse_page_list("1,2,3"), [1, 2, 3])
        self.assertListEqual(parse_page_list("1,3,2"), [1, 3, 2])
        self.assertListEqual(parse_page_list("1-3,5"), [1, 2, 3, 5])
        self.assertListEqual(parse_page_list("1-1,1,2-2,2,6-6,6"), [1, 1, 2, 2, 6, 6])
        self.assertListEqual(parse_page_list("5-3,1"), [5, 4, 3, 1])

    def test_error(self):
        self.assertRaises(MergeError, parse_page_list, "as")
        self.assertRaises(MergeError, parse_page_list, "1--2")
        self.assertRaises(MergeError, parse_page_list, "1,2,3,")
        self.assertRaises(MergeError, parse_page_list, "1-8,1-a")
        self.assertRaises(MergeError, parse_page_list, "8,1-,8")
        self.assertRaises(MergeError, parse_page_list, "1,,2")


class FakePdf:

    def __init__(self):
        self.pages = list()

    def remove_unreferenced_resources(self):
        pass

    def close(self):
        pass

    def save(self, filename, min_version=None):
        with open(filename, "w") as f:
            f.write(" ".join(self.pages))

    @property
    def pdf_version(self):
        return 0

    @contextmanager
    def open_metadata(self):
        yield dict()


def fake_open(self, document):
    pdf = FakePdf()
    pdf.pages = document.content.split(" ")
    return pdf


@mock.patch("documents.merge.Pdf.new", lambda: FakePdf())
@mock.patch("documents.merge.PdfCache.open_from_document", fake_open)
class TestExecuteSplitMergePlan(DirectoriesMixin, TestCase):

    def setUp(self) -> None:
        super(TestExecuteSplitMergePlan, self).setUp()
        self.tempdir = os.path.join(settings.SCRATCH_DIR, "split_merge")
        os.makedirs(self.tempdir, exist_ok=True)

    def _verify_results(self, files, expected_content):
        self.assertEqual(len(files), len(expected_content))
        for (file, content) in zip(files, expected_content):
            with open(file) as f:
                self.assertEqual(f.read(), content)

    def test_delete_page(self):
        doc1 = Document.objects.create(content="A B C")
        result = execute_split_merge_plan(
            plan=[
                [{"document": doc1.pk, "pages": "1,3"}]
            ],
            tempdir=self.tempdir,
        )
        self._verify_results(result, ["A C"])

    def test_split(self):
        doc1 = Document.objects.create(content="A B C")
        result = execute_split_merge_plan(
            plan=[
                [{"document": doc1.pk, "pages": "1,2"}],
                [{"document": doc1.pk, "pages": "3"}],
            ],
            tempdir=self.tempdir,
        )
        self._verify_results(result, ["A B", "C"])

    def test_merge(self):
        doc1 = Document.objects.create(content="A B C", checksum="A")
        doc2 = Document.objects.create(content="D E", checksum="B")
        result = execute_split_merge_plan(
            plan=[
                [{"document": doc2.pk}, {"document": doc1.pk}],
            ],
            tempdir=self.tempdir,
        )
        self._verify_results(result, ["D E A B C"])

    def test_partial_merge_reorder(self):
        doc1 = Document.objects.create(content="A B C", checksum="A")
        doc2 = Document.objects.create(content="D E", checksum="B")
        result = execute_split_merge_plan(
            plan=[
                [{"document": doc1.pk, "pages": "3,1"}, {"document": doc2.pk, "pages": "2"}],
            ],
            tempdir=self.tempdir,
        )
        self._verify_results(result, ["C A E"])

    def test_document_does_not_exist(self):
        self.assertRaisesMessage(
            MergeError,
            "Document 3456 does not exist.",
            execute_split_merge_plan,
            plan=[[{"document": 3456}]],
            tempdir=self.tempdir,
        )

    def test_page_out_of_range(self):
        doc1 = Document.objects.create(content="A B C")
        self.assertRaisesMessage(
            MergeError,
            "Page 4 is out of range.",
            execute_split_merge_plan,
            plan=[[{"document": doc1.pk, "pages": "4"}]],
            tempdir=self.tempdir,
        )

    @mock.patch("documents.merge.async_task")
    def test_no_preview(self, async_task: MagicMock):
        doc1 = Document.objects.create(content="A B C", checksum="A")
        doc2 = Document.objects.create(content="D E", checksum="B")
        result = execute_split_merge_plan(
            plan=[
                [{"document": doc2.pk}, {"document": doc1.pk}],
            ],
            tempdir=self.tempdir,
            preview=False,
            delete_source=False
        )
        async_task.assert_called_once()
        args, kwargs = async_task.call_args
        self.assertListEqual(kwargs['kwargs_list'], [{"path": result[0], "override_title": ""}])
        self.assertIsNone(kwargs['delete_document_ids'])

    @mock.patch("documents.merge.async_task")
    def test_no_preview_delete_source(self, async_task: MagicMock):
        doc1 = Document.objects.create(content="A B C", checksum="A")
        doc2 = Document.objects.create(content="D E", checksum="B")
        result = execute_split_merge_plan(
            plan=[
                [{"document": doc2.pk}, {"document": doc1.pk}],
            ],
            tempdir=self.tempdir,
            preview=False,
            delete_source=True
        )
        async_task.assert_called_once()
        args, kwargs = async_task.call_args
        self.assertCountEqual(kwargs['delete_document_ids'], [doc1.pk, doc2.pk])

    @mock.patch("documents.merge.async_task")
    @override_settings(TIME_ZONE="UTC")
    def test_metadata_copy_first(self, async_task: MagicMock):
        c1 = Correspondent.objects.create(name="c1")
        c2 = Correspondent.objects.create(name="c2")
        t1 = Tag.objects.create(name="t1")
        t2 = Tag.objects.create(name="t2")
        dt1 = DocumentType.objects.create(name="dt1")
        dt2 = DocumentType.objects.create(name="dt2")
        doc1 = Document.objects.create(content="A B C", checksum="A", title="titleA", correspondent=c1, document_type=dt1, created=timezone.datetime(2020, 12, 1, 0, 0, 0))
        doc1.tags.add(t1)
        doc2 = Document.objects.create(content="D E", checksum="B", title="titleB", correspondent=c2, document_type=dt2, created=timezone.datetime(2020, 2, 20, 0, 0, 0))
        doc2.tags.add(t2)

        result = execute_split_merge_plan(
            plan=[
                [{"document": doc2.pk}, {"document": doc1.pk}],
            ],
            tempdir=self.tempdir,
            preview=False,
            metadata="copy_first",
        )
        async_task.assert_called_once()
        args, kwargs = async_task.call_args
        self.assertEqual(1, len(kwargs['kwargs_list']))

        kwargs = kwargs['kwargs_list'][0]
        self.assertEqual(kwargs["override_title"], "titleB")
        self.assertEqual(kwargs["override_correspondent_id"], c2.pk)
        self.assertEqual(kwargs["override_tag_ids"], [t2.pk])
        self.assertEqual(kwargs["override_document_type_id"], dt2.pk)
        self.assertEqual(kwargs["override_date"], timezone.make_aware(datetime.datetime(2020, 2, 20, 0, 0, 0)))


def fake_consume_file(fail, *args, **kwargs):
    if fail:
        raise ConsumerError()
    return Document.objects.create(checksum=str(Document.objects.count())).pk


class TestConsumeManyFiles(DirectoriesMixin, TestCase):

    @mock.patch("documents.merge.tasks.consume_file")
    def test_success(self, consume_file: MagicMock):
        consume_file.side_effect = fake_consume_file
        consume_many_files([{"fail": False}, {"fail": False}])
        self.assertEqual(consume_file.call_count, 2)
        self.assertEqual(Document.objects.count(), 2)

    @mock.patch("documents.merge.tasks.consume_file")
    def test_fail(self, consume_file: MagicMock):
        consume_file.side_effect = fake_consume_file
        self.assertRaises(
            ConsumerError,
            consume_many_files,
            [{"fail": False}, {"fail": True}, {"fail": False}]
        )
        self.assertEqual(consume_file.call_count, 2)
        self.assertEqual(Document.objects.count(), 0)

    @mock.patch("documents.merge.tasks.consume_file")
    def test_success_delete_source(self, consume_file: MagicMock):
        doc_id = Document.objects.create().id
        self.assertTrue(Document.objects.filter(id=doc_id).exists())
        consume_file.side_effect = fake_consume_file
        consume_many_files([{"fail": False}, {"fail": False}], delete_document_ids=[doc_id])
        self.assertEqual(consume_file.call_count, 2)
        self.assertEqual(Document.objects.count(), 2)
        self.assertFalse(Document.objects.filter(id=doc_id).exists())

    @mock.patch("documents.merge.tasks.consume_file")
    def test_fail_no_delete_source(self, consume_file: MagicMock):
        doc_id = Document.objects.create().id
        self.assertTrue(Document.objects.filter(id=doc_id).exists())
        consume_file.side_effect = fake_consume_file
        self.assertRaises(
            ConsumerError,
            consume_many_files,
            [{"fail": False}, {"fail": True}],
            delete_document_ids=[doc_id]
        )
        self.assertEqual(consume_file.call_count, 2)
        self.assertEqual(Document.objects.count(), 1)
        self.assertTrue(Document.objects.filter(id=doc_id).exists())
