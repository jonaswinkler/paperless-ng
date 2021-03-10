import os
import tempfile

from django.conf import settings

from documents.models import Document

from pikepdf import Pdf


class MergeError(Exception):
    pass


def execute_split_merge_plan(plan, metadata: str, delete_source: bool, preview: bool):

    temp_dir = tempfile.mkdtemp(prefix="paperless-merge", dir=settings.SCRATCH_DIR)

    target_files = []

    for (i, target_document_spec) in enumerate(plan):

        # create a new document from documents in target_document_spec

        target_pdf: Pdf = Pdf.new()

        for source_document_spec in target_document_spec:

            source_document_id = source_document_spec['document']

            if 'pages' in source_document_spec:
                pages = source_document_spec['pages']
            else:
                pages = None

            try:
                source_document: Document = Document.objects.get(id=source_document_id)
            except Document.DoesNotExist:
                raise MergeError()

            if source_document.mime_type == 'application/pdf':
                source_pdf: Pdf = Pdf.open(source_document.source_path)
            elif source_document.has_archive_version:
                source_pdf: Pdf = Pdf.open(source_document.archive_path)
            else:
                raise MergeError()

            if pages is not None:
                for page in pages:
                    if page >= len(source_pdf.pages):
                        raise MergeError()
                    target_pdf.pages.append(source_pdf.pages[page])
            else:
                target_pdf.pages.extend(source_pdf.pages)

        target_pdf_filename = os.path.join(temp_dir, f"{i+1:02}.pdf")
        target_pdf.save(target_pdf_filename)
        target_files.append(target_pdf_filename)

    if not preview:
        pass

        if delete_source:
            pass

    return target_files
