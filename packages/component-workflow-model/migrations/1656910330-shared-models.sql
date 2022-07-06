CREATE TABLE "comment" (
    "id" int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "created" timestamptz NOT NULL DEFAULT current_timestamp,
    "updated" timestamptz NOT NULL DEFAULT current_timestamp,
    "author_id" uuid REFERENCES "identity",
    "comment_body" text
);
