/** Shared GraphQL for program directory lists (explore + camps). */

/**
 * LAZY_LOAD_PROGRAMS: set to true to re-enable paginated infinite-scroll loading.
 * When false, the page fetches all programs in one shot on the server and the
 * IntersectionObserver / loadMore path is disabled on the client.
 */
export const LAZY_LOAD_PROGRAMS = false;

/** Batch size used for each paginated fetch when LAZY_LOAD_PROGRAMS is true. */
export const PROGRAMS_PAGE_SIZE = 24;

/** Page size used when LAZY_LOAD_PROGRAMS is false — large enough to pull everything at once. */
export const PROGRAMS_ALL_AT_ONCE = 999;

/** Larger first page on /camps so camp-only results are more likely populated before scroll. */
export const CAMPS_PROGRAMS_FIRST = 120;

export const PROGRAMS_LIST_QUERY = /* GraphQL */ `
  query ProgramsList($first: Int!, $after: String) {
    programs(first: $first, after: $after, where: { stati: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        programFields {
          summary
          gallery {
            photos {
              node {
                sourceUrl
                altText
              }
            }
          }
          offeringType
          skillLevel
          priceFrom
          audience { nodes { name slug } }
          campType { nodes { name slug } }
          center {
            nodes {
              ... on Center {
                slug
                title
              }
            }
          }
          programArea { nodes { name slug } }
          isSpecialtyFitnessClass
          registrationInformation {
            registrationLink
          }
        }
      }
    }
  }
`;
