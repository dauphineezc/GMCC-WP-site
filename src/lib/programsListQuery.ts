/** Shared GraphQL for program directory lists (explore + camps). */
export const PROGRAMS_PAGE_SIZE = 24;

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
          mediaGallery {
            image1 {
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
        }
      }
    }
  }
`;
