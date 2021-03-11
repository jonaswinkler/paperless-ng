import os
import tempfile

from django.conf import settings
from django_q.tasks import async_task

from documents import tasks
from documents.consumer import ConsumerError
from documents.models import Document

from pikepdf import Pdf


class MergeError(Exception):
    pass


class PdfCache:

    def __init__(self):
        self.cache = dict()

    def open_from_document(self, document: Document):
        if document.pk in self.cache:
            return self.cache[document.pk]

        if document.mime_type == 'application/pdf':
            filename = document.source_path
        elif document.has_archive_version:
            filename = document.archive_path
        else:
            raise MergeError()

        if not os.path.exists(filename):
            raise MergeError()

        pdf = Pdf.open(filename)
        self.cache[document.pk] = pdf

        return pdf

    def close_all(self):
        for pk in self.cache:
            self.cache[pk].close()

        self.cache.clear()


def consume_many_files(kwargs_list, delete_document_ids=None):
    new_document_ids = []

    try:
        for kwargs in kwargs_list:
            new_document_ids.append(tasks.consume_file(**kwargs))

    except ConsumerError:
        # in case something goes wrong, delete all previously created documents
        for document_id in new_document_ids:
            Document.objects.get(id=document_id).delete()
        raise
    else:
        # If everything goes well, optionally delete source documents
        if delete_document_ids:
            for document_id in delete_document_ids:
                Document.objects.get(id=document_id).delete()


def execute_split_merge_plan(plan, tempdir: str, metadata: str = "redo", delete_source: bool = False, preview: bool = True):

    consume_tasks = []
    cache = PdfCache()
    source_documents = set()

    try:
        for (i, target_document_spec) in enumerate(plan):
            # create a new document from documents in target_document_spec

            target_pdf: Pdf = Pdf.new()
            version = target_pdf.pdf_version

            for source_document_spec in target_document_spec:
                source_document_id = source_document_spec['document']
                source_documents.add(source_document_id)

                if 'pages' in source_document_spec:
                    pages = source_document_spec['pages']
                else:
                    pages = None

                try:
                    source_document: Document = Document.objects.get(id=source_document_id)
                except Document.DoesNotExist:
                    raise MergeError()

                source_pdf: Pdf = cache.open_from_document(source_document)
                version = max(version, source_pdf.pdf_version)

                if pages is not None:
                    for page in pages:
                        if page >= len(source_pdf.pages):
                            raise MergeError()
                        target_pdf.pages.append(source_pdf.pages[page])
                else:
                    target_pdf.pages.extend(source_pdf.pages)

            target_pdf_filename = tempfile.NamedTemporaryFile(suffix="_pdf", dir=tempdir).name
            target_pdf.remove_unreferenced_resources()
            target_pdf.save(target_pdf_filename, min_version=version)
            target_pdf.close()

            consume_task = {"path": target_pdf_filename}

            first_id = target_document_spec[0]["document"]
            first_doc: Document = Document.objects.get(id=first_id)

            consume_task["override_title"] = first_doc.title

            if metadata == "copy_first":
                if first_doc.correspondent:
                    consume_task["override_correspondent_id"] = first_doc.correspondent.id
                if first_doc.document_type:
                    consume_task["override_document_type_id"] = first_doc.document_type.hidden
                if first_doc.tags.count() > 0:
                    consume_task["override_tag_ids"] = [tag.id for tag in first_doc.tags]

            consume_tasks.append(consume_task)
    finally:
        cache.close_all()

    if not preview:
        async_task(
            "documents.merge.consume_many_files",
            kwargs_list=consume_tasks,
            delete_document_ids=list(source_documents) if delete_source else None
        )

    return [os.path.basename(t["path"]) for t in consume_tasks]
