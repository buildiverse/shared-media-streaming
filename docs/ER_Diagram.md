
## Shared media Streaming Entity relation diagram

#### Primary Entities and Their Relationships:

`1. USER → MEDIA (One-to-Many)`

- A user can upload multiple media files
- Each media file is uploaded by exactly one user
- Relationship established through uploadedBy field in Media schema


`2. USER → ROOM (One-to-Many)`

- A user can join multiple rooms
- Each room has exactly one host
- Relationship established through hostUserId field in Room schema


`3. USER → MESSAGE (One-to-Many)`

- A user can send multiple messages across different rooms
- Each message is sent by exactly one user
- Relationship established through senderId field in Message schema

`4. ROOM → MESSAGE (One-to-Many)`

- A room can contain multiple messages (chat history)
- Each message belongs to exactly one room
- Relationship established through roomId field in Message schema

`5. MEDIA → ROOM (One-to-Many)`

- A media file can be shared in multiple rooms
- Each room shows exactly one media file at a time
- Relationship established through mediaId field in Room schema

`6. ROOM → PLAYBACK (One-to-One)`

- Each room has exactly one playback state
- Playback is embedded as a subdocument in Room schema
- Contains synchronization data (state, currentTime, updatedAt)

### Key Application Flow:

- Users upload Media files to the platform
- Users create Rooms and select which Media to share
- Other users join the Room and can send Messages
- The Room maintains synchronized Playback state for all participants
- Messages create a chat experience alongside the shared media viewing

![Alt text](/docs/diagram-export-8-15-2025-5_37_11-PM.png "Optional title text")