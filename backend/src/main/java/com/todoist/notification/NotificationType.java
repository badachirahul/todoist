package com.todoist.notification;

/** What happened, so the frontend can render the right sentence. */
public enum NotificationType {
    INVITED_TO_PROJECT,   // "{actor} invited you to {subject}" (+ Accept button)
    ADDED_TO_PROJECT,     // "{actor} added you to {subject}"
    REMOVED_FROM_PROJECT, // "{actor} removed you from {subject}"
    JOINED_PROJECT,       // "{actor} joined {subject}"
    LEFT_PROJECT,         // "{actor} left {subject}"
    COMMENT_ADDED         // "{actor} added a comment to {subject}" (+ body = comment text)
}
