# Firestore rules for notifications + message attachments stage

Publish these Firestore rules when testing message notifications, trial notifications,
message attachments, message replies, and urgent message flags.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function relationshipPath(relationshipId) {
      return /databases/$(database)/documents/studentTutorRelationships/$(relationshipId);
    }

    function relationshipData(relationshipId) {
      return get(relationshipPath(relationshipId)).data;
    }

    function isRelationshipDocumentParticipant() {
      return isSignedIn()
        && (
          resource.data.studentId == request.auth.uid ||
          resource.data.tutorId == request.auth.uid
        );
    }

    function isRelationshipParticipant(relationshipId) {
      return isSignedIn()
        && exists(relationshipPath(relationshipId))
        && (
          relationshipData(relationshipId).studentId == request.auth.uid ||
          relationshipData(relationshipId).tutorId == request.auth.uid
        );
    }

    function isRelationshipStudent(relationshipId) {
      return isSignedIn()
        && exists(relationshipPath(relationshipId))
        && relationshipData(relationshipId).studentId == request.auth.uid;
    }

    function isNewRelationshipParticipant() {
      return isSignedIn()
        && (
          request.resource.data.studentId == request.auth.uid ||
          request.resource.data.tutorId == request.auth.uid
        );
    }

    function relationshipIdentityUnchanged() {
      return request.resource.data.studentId == resource.data.studentId
        && request.resource.data.tutorId == resource.data.tutorId
        && request.resource.data.studentName == resource.data.studentName
        && request.resource.data.tutorName == resource.data.tutorName
        && request.resource.data.studentEmail == resource.data.studentEmail
        && request.resource.data.tutorEmail == resource.data.tutorEmail
        && request.resource.data.subject == resource.data.subject
        && request.resource.data.level == resource.data.level;
    }

    function allowedMessageUpdateFieldsOnly() {
      return request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['body', 'urgency', 'updatedAt']);
    }

    function messageBodyOrAttachmentPresent() {
      return request.resource.data.body.size() > 0
        || request.resource.data.attachments.size() > 0;
    }

    function validMessageUrgency(relationshipId) {
      return request.resource.data.urgency in ['normal', 'urgent']
        && (
          request.resource.data.urgency == 'normal' ||
          isRelationshipStudent(relationshipId)
        );
    }

    function validMessageShape(relationshipId) {
      return request.resource.data.body is string
        && request.resource.data.body.size() <= 2000
        && request.resource.data.attachments is list
        && request.resource.data.attachments.size() <= 5
        && request.resource.data.urgency is string
        && validMessageUrgency(relationshipId)
        && messageBodyOrAttachmentPresent();
    }

    match /users/{userId} {
      allow read, create, update: if isOwner(userId);
    }

    match /studentProfiles/{studentId} {
      allow read, create, update, delete: if isOwner(studentId);
    }

    match /tutorProfiles/{tutorId} {
      allow read: if true;
      allow create, update, delete: if isOwner(tutorId);
    }

    match /trialSessionRequests/{requestId} {
      allow create: if isSignedIn();

      allow read, update, delete: if isSignedIn()
        && (
          resource.data.studentId == request.auth.uid ||
          resource.data.tutorId == request.auth.uid
        );
    }

    match /studentTutorRelationships/{relationshipId} {
      allow read: if isRelationshipDocumentParticipant();

      allow create: if isNewRelationshipParticipant()
        && request.resource.data.status == "active";

      allow update: if isRelationshipDocumentParticipant()
        && relationshipIdentityUnchanged();

      allow delete: if false;

      match /messages/{messageId} {
        allow read: if isRelationshipParticipant(relationshipId);

        allow create: if isRelationshipParticipant(relationshipId)
          && request.resource.data.senderId == request.auth.uid
          && validMessageShape(relationshipId);

        allow update: if isRelationshipParticipant(relationshipId)
          && resource.data.senderId == request.auth.uid
          && allowedMessageUpdateFieldsOnly()
          && validMessageShape(relationshipId);

        allow delete: if isRelationshipParticipant(relationshipId)
          && resource.data.senderId == request.auth.uid;
      }
    }
  }
}
```
