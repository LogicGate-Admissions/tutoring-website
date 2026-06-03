# Firestore rules for message notifications stage

Publish these rules when testing `feature/message-notifications`.

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
          get(relationshipPath(relationshipId)).data.studentId == request.auth.uid ||
          get(relationshipPath(relationshipId)).data.tutorId == request.auth.uid
        );
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
        && request.resource.data.subject == resource.data.subject
        && request.resource.data.level == resource.data.level;
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
          && request.resource.data.body is string
          && request.resource.data.body.size() > 0
          && request.resource.data.body.size() <= 2000;

        allow update, delete: if false;
      }
    }
  }
}
```
