from rest_framework import serializers
from .models import Form, FormSection, FormQuestion, FormResponse, ResponseComment


class FormQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormQuestion
        fields = '__all__'


class FormSectionSerializer(serializers.ModelSerializer):
    questions = FormQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = FormSection
        fields = '__all__'


class FormSerializer(serializers.ModelSerializer):
    sections = FormSectionSerializer(many=True, read_only=True)
    questions = FormQuestionSerializer(many=True, read_only=True)
    response_count = serializers.SerializerMethodField()

    class Meta:
        model = Form
        fields = '__all__'

    def get_response_count(self, obj):
        return obj.responses.count()


class FormResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormResponse
        fields = '__all__'


class ResponseCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True, default='')

    class Meta:
        model = ResponseComment
        fields = '__all__'
