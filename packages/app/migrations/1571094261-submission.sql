CREATE SEQUENCE manuscript_id;

CREATE TABLE "submission" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "created" timestamptz NOT NULL DEFAULT current_timestamp,
    "updated" timestamptz NOT NULL DEFAULT current_timestamp,

    "submitter_id" uuid REFERENCES "identity",
    "curator_id" uuid REFERENCES "identity",

    "manuscript_id" text,
    "submission_date" timestamptz,
    "publish_date" timestamptz,
    "last_publish_date" timestamptz,
    "unpublished_changes" boolean,

    "kind" text,
    "title" text,
    "abstract" text,
    "authors" JSONB,
    "primary_papers" JSONB,
    "funding" JSONB,
    "keywords" JSONB,
    "iups_commission" text,

    "model_source" text,
    "model_pmr_workspace_uri" text,
    "model_repository_uri" text,

    "price_acknowledged" boolean,

    "phase" text,
    "hidden" boolean,
    "curation_notes" text,

    "rejection_reason" text,
    "rejection_other" text,
    "revisions_note" text,

    "all_files_present" boolean,
    "results_match" boolean,
    "model_annotated" boolean,
    "primary_paper_exists" boolean,
    "results_in_papers_overlap" boolean,
    "same_model_in_papers" boolean,
    "manuscript_accepted" boolean,
    "payment_skipped" boolean,

    "figshare_article_id" text,
    "figshare_article_doi" text,
    "publishing_pmr_details" JSONB,

    "payment_session_id" text,
    "payment_completed" boolean
);


CREATE AGGREGATE tsvector_agg (tsvector) (
  SFUNC = tsvector_concat,
  STYPE = tsvector
);

CREATE OR REPLACE FUNCTION submission_authors_names_to_tsvector( jsondata jsonb, out tsv tsvector )
AS $func$
  BEGIN
    SELECT INTO tsv
      tsvector_agg(to_tsvector('english', d->>'name'))
    FROM jsonb_array_elements(jsondata) AS d;
    RETURN;
  END;
$func$ LANGUAGE plpgsql
IMMUTABLE;


CREATE INDEX submission_title_indx ON "submission" USING gin(to_tsvector('english', title));

CREATE INDEX submission_authors_indx ON "submission" USING gin(submission_authors_names_to_tsvector(authors));



CREATE TABLE "submission-article-files" (
    "id" INT GENERATED BY DEFAULT AS IDENTITY,
    "submission_id" uuid REFERENCES "submission",
    "file_id" uuid REFERENCES "file",
    "order" int,
    "removed" boolean
);



CREATE TABLE "submission-model-files" (
    "id" INT GENERATED BY DEFAULT AS IDENTITY,
    "submission_id" uuid REFERENCES "submission",
    "file_id" uuid REFERENCES "file",
    "order" int,
    "removed" boolean
);



CREATE TABLE "submission-supplementary-files" (
    "id" INT GENERATED BY DEFAULT AS IDENTITY,
    "submission_id" uuid REFERENCES "submission",
    "file_id" uuid REFERENCES "file",
    "order" int,
    "label" text,
    "type" text,
    "removed" boolean
);
