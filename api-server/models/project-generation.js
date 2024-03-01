//Responsible for project managements and build tasks
const logger = require('../utils/logger');
const {generateSlug} = require('random-word-slugs')
async function generateSlugName(gitURL) {
  //Craetes a slug from the gitURL and timestamp
  console.log(`Generating slug for ${gitURL}`);
  const slug = generateSlug(3);
  return slug;
}


module.exports = {
  generateSlugName
}
