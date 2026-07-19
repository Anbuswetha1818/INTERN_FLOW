from django.urls import path
from . import views

urlpatterns = [
    path('forms/', views.FormListCreateView.as_view(), name='forms'),
    path('forms/<int:pk>/', views.FormDetailView.as_view(), name='form-detail'),
    path('forms/<int:pk>/upload_banner/', views.FormBannerUploadView.as_view(), name='form-banner'),
    path('forms/<int:pk>/analytics/', views.FormAnalyticsView.as_view(), name='form-analytics'),
    path('forms/<int:pk>/responses/', views.FormResponsesView.as_view(), name='form-responses'),
    path('public/feedback/<int:form_id>/', views.PublicFeedbackView.as_view(), name='public-feedback'),
    path('responses/<int:response_id>/consult/', views.ToggleConsultView.as_view(), name='toggle-consult'),
    path('responses/<int:response_id>/comments/', views.ResponseCommentView.as_view(), name='response-comments'),
]
