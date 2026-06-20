from django.urls import path
from .views import (
    NotificationListView, MarkNotificationReadView, MarkAllReadView,
    UnreadNotificationCountView,
    InboxView, SentView, SendMessageView, AnnouncementView,
    MessageDetailView, MarkMessageReadView, UnreadMessageCountView,
    MessageRepliesView,
)

urlpatterns = [
    # Notifications
    path('',                        NotificationListView.as_view(),      name='notification-list'),
    path('unread-count/',           UnreadNotificationCountView.as_view(), name='notification-unread-count'),
    path('<int:pk>/read/',          MarkNotificationReadView.as_view(),  name='notification-read'),
    path('read-all/',               MarkAllReadView.as_view(),           name='notification-read-all'),

    # Messages
    path('messages/',               InboxView.as_view(),                 name='message-inbox'),
    path('messages/sent/',          SentView.as_view(),                  name='message-sent'),
    path('messages/send/',          SendMessageView.as_view(),           name='message-send'),
    path('messages/announce/',      AnnouncementView.as_view(),          name='message-announce'),
    path('messages/<int:pk>/',      MessageDetailView.as_view(),         name='message-detail'),
    path('messages/<int:pk>/read/', MarkMessageReadView.as_view(),       name='message-mark-read'),
    path('messages/<int:pk>/replies/', MessageRepliesView.as_view(),     name='message-replies'),
    path('messages/unread-count/',  UnreadMessageCountView.as_view(),    name='message-unread-count'),
]
