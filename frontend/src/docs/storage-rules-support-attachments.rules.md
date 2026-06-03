# Storage rules for support attachments

No Firebase Storage rules are needed for the current free-plan demo.

Firebase Storage is not used in this version because the project is staying on
the free Firebase plan. Message attachments are saved as Firestore metadata only:
file name, size, MIME type, kind, and ownership context.

This keeps the attachment workflow testable without paid storage. If the project
later moves to Firebase Storage, S3, or another file provider, replace the demo
metadata provider in:

```txt
src/domains/attachments/services/attachmentUploadService.ts
```

and then add provider-specific storage rules.
