# Endpoints
These are all the HTTP endpoints opened by the WebInterface, if you're
writing a valid Minecraft plugin for this appservice you start here. As
long as each request and response is handled properly then you have a
valid plugin.

## The Chat Endpoint

### GET /chat

#### Required Headers:
The provided JSON web token describes what room the server is bridged with.
 - Content-Type: `application/json`
 - Authorization: `Bearer <JSON WEB TOKEN>`

#### Request Body
None

#### Response Body:
The response body returns an array of pre-formatted messages like
"\<Dylan> Hello!", this can easily just be sent to the Minecraft chat as is.

| Attribute | Type     | Description                                                                |
|-----------|----------|----------------------------------------------------------------------------|
| chat      | string[] | An array of pre-formatted messages ready to be sent to the Minecraft chat. |

### POST /chat
This endpoint is for sending a Minecraft chat message to the bridged Matrix
 room.

#### Required Headers:
The provided JSON web token describes what room the server is bridged with.
 - Content-Type: `application/json`
 - Authorization: `Bearer <JSON WEB TOKEN>`

#### Request Body:
| Attribute | Type   | Description                           |
|-----------|--------|---------------------------------------|
| message   | string | The raw text message sent by a player |
| player    | Player | The player who sent the message       |

##### Player Object:
This describes the player who sent the message, all the attributes must not
be null or undefined.

| Attribute | Type   | Description            |
|-----------|--------|------------------------|
| name      | string | The name of the player |
| uuid      | string | The UUID of the player |

#### Response Body:
None (200 OK)