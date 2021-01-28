from django.test import TestCase

from documents.models import Document, CustomMetaDataField, CustomMetaDataFieldBooleanValue, \
    CustomMetaDataFieldShortTextValue


class CustomMetadataTest(TestCase):

    def test_typing(self):

        doc = Document.objects.create(title="test", checksum="asd")

        field1 = CustomMetaDataField.objects.create(type_string="boolean")
        field2 = CustomMetaDataField.objects.create(type_string="short_text")

        CustomMetaDataFieldBooleanValue.objects.create(value=True, field=field1, document=doc)
        CustomMetaDataFieldShortTextValue.objects.create(value="test", field=field2, document=doc)

        self.assertEqual(doc.custom_metadata.all().count(), 2)
        self.assertEqual(doc.custom_metadata.all()[0].boolean.value, True)
        self.assertEqual(doc.custom_metadata.all()[1].shorttext.value, "test")

    def test_sorting(self):

        doc1 = Document.objects.create(title="test", checksum="A")
        doc2 = Document.objects.create(title="test", checksum="B")

        field = CustomMetaDataField.objects.create(type_string="short_text")

        CustomMetaDataFieldShortTextValue.objects.create(value="testA", field=field, document=doc1)
        CustomMetaDataFieldShortTextValue.objects.create(value="testB", field=field, document=doc2)

        docs1 = list(Document.objects.order_by("custom_metadata__shorttext__value"))
        docs2 = list(Document.objects.order_by("-custom_metadata__shorttext__value"))

        self.assertListEqual([d.id for d in docs1], [doc1.id, doc2.id])
        self.assertListEqual([d.id for d in docs2], [doc2.id, doc1.id])

    def test_filtering(self):

        doc1 = Document.objects.create(title="test", checksum="A")
        doc2 = Document.objects.create(title="test", checksum="B")

        field = CustomMetaDataField.objects.create(type_string="short_text")

        CustomMetaDataFieldShortTextValue.objects.create(value="testA", field=field, document=doc1)
        CustomMetaDataFieldShortTextValue.objects.create(value="testB", field=field, document=doc2)

        docs1 = list(Document.objects.filter(custom_metadata__shorttext__value__iexact="testa"))
        docs2 = list(Document.objects.filter(custom_metadata__shorttext__value__exact="testb"))
        docs3 = list(Document.objects.filter(custom_metadata__shorttext__value__icontains="TEST"))

        self.assertListEqual([d.id for d in docs1], [doc1.id])
        self.assertListEqual([d.id for d in docs2], [])
        self.assertCountEqual([d.id for d in docs3], [doc1.id, doc2.id])
