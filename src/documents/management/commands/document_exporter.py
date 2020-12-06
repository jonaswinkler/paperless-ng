import json
import os
import shutil
import time

from django.conf import settings
from django.core import serializers
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from documents.models import Document, Correspondent, Tag, DocumentType
from documents.settings import EXPORTER_FILE_NAME, EXPORTER_THUMBNAIL_NAME, \
    EXPORTER_ARCHIVE_NAME
from paperless.db import GnuPG
from ...file_handling import generate_filename
from ...mixins import Renderable


class Command(Renderable, BaseCommand):

    help = """
        Decrypt and rename all files in our collection into a given target
        directory.  And include a manifest file containing document data for
        easy import.
    """.replace("    ", "")

    def add_arguments(self, parser):
        parser.add_argument("target")

    def __init__(self, *args, **kwargs):
        BaseCommand.__init__(self, *args, **kwargs)
        self.target = None

    def handle(self, *args, **options):

        self.target = options["target"]

        if not os.path.exists(self.target):
            raise CommandError("That path doesn't exist")

        if not os.access(self.target, os.W_OK):
            raise CommandError("That path doesn't appear to be writable")

        self.dump()

    def dump(self):

        documents = Document.objects.all()
        document_map = {d.pk: d for d in documents}
        manifest = json.loads(serializers.serialize("json", documents))

        for index, document_dict in enumerate(manifest):

            # Force output to unencrypted as that will be the current state.
            # The importer will make the decision to encrypt or not.
            manifest[index]["fields"]["storage_type"] = Document.STORAGE_TYPE_UNENCRYPTED  # NOQA: E501

            document = document_map[document_dict["pk"]]

            if settings.PAPERLESS_FILENAME_FORMAT:
                # set storagy type temporarily for filename generation
                storage_type_actual = document.storage_type

                document.storage_type = Document.STORAGE_TYPE_UNENCRYPTED
                name = generate_filename(document)

                document.storage_type = storage_type_actual
            else:
                name = f"{slugify(str(document))}_{document.id}{document.file_type}"
            original_name = os.path.join("originals", name)
            original_target = os.path.join(self.target, original_name)
            os.makedirs(os.path.dirname(original_target), exist_ok=True)

            thumbnail_name = os.path.splitext(name)[0] + ".png"
            thumbnail_name = os.path.join("thumbnails", thumbnail_name)
            thumbnail_target = os.path.join(self.target, thumbnail_name)
            os.makedirs(os.path.dirname(thumbnail_target), exist_ok=True)

            document_dict[EXPORTER_FILE_NAME] = original_name
            document_dict[EXPORTER_THUMBNAIL_NAME] = thumbnail_name

            if os.path.exists(document.archive_path):
                archive_name = os.path.splitext(name)[0] + ".pdf"
                archive_name = os.path.join("archive", archive_name)
                archive_target = os.path.join(self.target, archive_name)
                os.makedirs(os.path.dirname(archive_target), exist_ok=True)
                document_dict[EXPORTER_ARCHIVE_NAME] = archive_name
            else:
                archive_name = None
                archive_target = None

            print(f"Exporting: {document}")

            t = int(time.mktime(document.created.timetuple()))
            if document.storage_type == Document.STORAGE_TYPE_GPG:

                with open(original_target, "wb") as f:
                    f.write(GnuPG.decrypted(document.source_file))
                    os.utime(original_target, times=(t, t))

                with open(thumbnail_target, "wb") as f:
                    f.write(GnuPG.decrypted(document.thumbnail_file))
                    os.utime(thumbnail_target, times=(t, t))

                if archive_target:
                    with open(archive_target, "wb") as f:
                        f.write(GnuPG.decrypted(document.archive_path))
                        os.utime(archive_target, times=(t, t))
            else:

                shutil.copy(document.source_path, original_target)
                shutil.copy(document.thumbnail_path, thumbnail_target)

                if archive_target:
                    shutil.copy(document.archive_path, archive_target)

        manifest += json.loads(
            serializers.serialize("json", Correspondent.objects.all()))

        manifest += json.loads(serializers.serialize(
            "json", Tag.objects.all()))

        manifest += json.loads(serializers.serialize(
            "json", DocumentType.objects.all()))

        with open(os.path.join(self.target, "manifest.json"), "w") as f:
            json.dump(manifest, f, indent=2)
