"use strict";

function unavailable() {
  throw new Error("@napi-rs/canvas is not available in this build.");
}

class Image {}

module.exports = {
  createCanvas: unavailable,
  loadImage: async () => unavailable(),
  Image,
};
