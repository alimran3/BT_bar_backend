const { PAGINATION } = require('../constants');

/**
 * Paginate results
 * @param {Object} query - Mongoose query object
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object} - Pagination data
 */
exports.paginate = async (query, page = 1, limit = 10) => {
  const currentPage = parseInt(page) || PAGINATION.DEFAULT_PAGE;
  const itemsPerPage = Math.min(
    parseInt(limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );

  const skip = (currentPage - 1) * itemsPerPage;

  const [results, total] = await Promise.all([
    query.skip(skip).limit(itemsPerPage),
    query.model.countDocuments(query.getQuery()),
  ]);

  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    results,
    pagination: {
      currentPage,
      itemsPerPage,
      totalItems: total,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
  };
};

/**
 * Get pagination metadata
 */
exports.getPaginationMeta = (total, page, limit) => {
  const currentPage = parseInt(page) || PAGINATION.DEFAULT_PAGE;
  const itemsPerPage = parseInt(limit) || PAGINATION.DEFAULT_LIMIT;
  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    currentPage,
    itemsPerPage,
    totalItems: total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
};