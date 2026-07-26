-- Host-authored pickup instructions, surfaced on Trip Detail once a booking
-- exists (design/mockups/11-trip-detail.html). Nullable: existing listings
-- have none and the section simply doesn't render.
ALTER TABLE "Vehicle" ADD COLUMN "pickupInstructions" TEXT;
