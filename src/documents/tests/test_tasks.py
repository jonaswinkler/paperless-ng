import os
from unittest import mock

from django.conf import settings
from django.test import TestCase
from django.utils import timezone

from documents import tasks
from documents.models import Document, Tag, Correspondent, DocumentType
from documents.sanity_checker import SanityCheckMessages, SanityCheckFailedException
from documents.tests.utils import DirectoriesMixin


class TestTasks(DirectoriesMixin, TestCase):

    def test_index_reindex(self):
        Document.objects.create(title="test", content="my document", checksum="wow", added=timezone.now(), created=timezone.now(), modified=timezone.now())

        tasks.index_reindex()

    def test_index_optimize(self):
        Document.objects.create(title="test", content="my document", checksum="wow", added=timezone.now(), created=timezone.now(), modified=timezone.now())

        tasks.index_optimize()

    @mock.patch("documents.tasks.load_classifier")
    def test_train_classifier_no_auto_matching(self, load_classifier):
        tasks.train_classifier()
        load_classifier.assert_not_called()

    @mock.patch("documents.tasks.load_classifier")
    def test_train_classifier_with_auto_tag(self, load_classifier):
        load_classifier.return_value = None
        Tag.objects.create(matching_algorithm=Tag.MATCH_AUTO, name="test")
        tasks.train_classifier()
        load_classifier.assert_called_once()
        self.assertFalse(os.path.isfile(settings.MODEL_FILE))

    @mock.patch("documents.tasks.load_classifier")
    def test_train_classifier_with_auto_type(self, load_classifier):
        load_classifier.return_value = None
        DocumentType.objects.create(matching_algorithm=Tag.MATCH_AUTO, name="test")
        tasks.train_classifier()
        load_classifier.assert_called_once()
        self.assertFalse(os.path.isfile(settings.MODEL_FILE))

    @mock.patch("documents.tasks.load_classifier")
    def test_train_classifier_with_auto_correspondent(self, load_classifier):
        load_classifier.return_value = None
        Correspondent.objects.create(matching_algorithm=Tag.MATCH_AUTO, name="test")
        tasks.train_classifier()
        load_classifier.assert_called_once()
        self.assertFalse(os.path.isfile(settings.MODEL_FILE))

    def test_train_classifier(self):
        c = Correspondent.objects.create(matching_algorithm=Tag.MATCH_AUTO, name="test")
        doc = Document.objects.create(correspondent=c, content="test", title="test")
        self.assertFalse(os.path.isfile(settings.MODEL_FILE))

        tasks.train_classifier()
        self.assertTrue(os.path.isfile(settings.MODEL_FILE))
        mtime = os.stat(settings.MODEL_FILE).st_mtime

        tasks.train_classifier()
        self.assertTrue(os.path.isfile(settings.MODEL_FILE))
        mtime2 = os.stat(settings.MODEL_FILE).st_mtime
        self.assertEqual(mtime, mtime2)

        doc.content = "test2"
        doc.save()
        tasks.train_classifier()
        self.assertTrue(os.path.isfile(settings.MODEL_FILE))
        mtime3 = os.stat(settings.MODEL_FILE).st_mtime
        self.assertNotEqual(mtime2, mtime3)

    @mock.patch("documents.tasks.sanity_checker.check_sanity")
    def test_sanity_check_success(self, m):
        m.return_value = SanityCheckMessages()
        self.assertEqual(tasks.sanity_check(), "No issues detected.")
        m.assert_called_once()

    @mock.patch("documents.tasks.sanity_checker.check_sanity")
    def test_sanity_check_error(self, m):
        messages = SanityCheckMessages()
        messages.error("Some error")
        m.return_value = messages
        self.assertRaises(SanityCheckFailedException, tasks.sanity_check)
        m.assert_called_once()

    @mock.patch("documents.tasks.sanity_checker.check_sanity")
    def test_sanity_check_warning(self, m):
        messages = SanityCheckMessages()
        messages.warning("Some warning")
        m.return_value = messages
        self.assertEqual(tasks.sanity_check(), "Sanity check exited with warnings. See log.")
        m.assert_called_once()

    @mock.patch("documents.tasks.sanity_checker.check_sanity")
    def test_sanity_check_info(self, m):
        messages = SanityCheckMessages()
        messages.info("Some info")
        m.return_value = messages
        self.assertEqual(tasks.sanity_check(), "Sanity check exited with infos. See log.")
        m.assert_called_once()

    def test_remove_expired_documents(self):
        self.assertEqual(tasks.remove_expired_documents(), "0 expired documents deleted.")

    def test_remove_expired_one_from_one(self):
        Document.objects.create(title="test", content="my document", checksum="wow", added=timezone.now(),
                                created=timezone.now(), modified=timezone.now(), expired=timezone.now()+timezone.timedelta(days=-1))
        self.assertEqual(tasks.remove_expired_documents(), "1 expired documents deleted.")

    def test_remove_expired_zero_from_one(self):
        Document.objects.create(title="test", content="my document", checksum="wow", added=timezone.now(),
                                created=timezone.now(), modified=timezone.now(), expired=timezone.now()+timezone.timedelta(days=1))
        self.assertEqual(tasks.remove_expired_documents(), "0 expired documents deleted.")

    def test_remove_expired_one_from_three(self):
        Document.objects.create(title="test", content="my document", checksum="wow1", added=timezone.now(),
                                created=timezone.now(), modified=timezone.now(), expired=timezone.now()+timezone.timedelta(days=-1))
        Document.objects.create(title="test", content="my document", checksum="wow2", added=timezone.now(),
                                created=timezone.now(), modified=timezone.now(), expired=timezone.now()+timezone.timedelta(days=1))
        Document.objects.create(title="test", content="my document", checksum="wow3", added=timezone.now(),
                                created=timezone.now(), modified=timezone.now())
        self.assertEqual(tasks.remove_expired_documents(), "1 expired documents deleted.")

    def test_bulk_update_documents(self):
        doc1 = Document.objects.create(title="test", content="my document", checksum="wow", added=timezone.now(),
                                created=timezone.now(), modified=timezone.now())

        tasks.bulk_update_documents([doc1.pk])
