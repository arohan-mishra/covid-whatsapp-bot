const searchGraphQLQuery = gql`
  query($location: String, $query: String) {
    # get hospitals from a city named Bengaluru in the state of Karnataka
    locality(name: $location) {
      hospitals(first: 5, searchQuery: $query) {
        edges {
          node {
            id
            name
            phone
            website
            address
            latitude
            longitude

            icuAvailable
            hduAvailable
            oxygenAvailable
            generalAvailable
            ventilatorsAvailable

            icuOccupied
            hduOccupied
            oxygenOccupied
            generalOccupied
            ventilatorsOccupied

            icuTotal
            hduTotal
            oxygenTotal
            generalTotal
            ventilatorsTotal
          }
        }
      }
    }
  }
`

module.exports = {
  searchGraphQLQuery,
}
`

const locationKey = {
    bangalore: "bengaluru-karnataka",
    bengaluru: "bengaluru-karnataka",
    pune: "pune-maharashtra",
    kohlapur: "kohlapur-maharashtra",
    sangli: "sangli-maharashtra",
    satara: "satara-maharashtra",
    solapur: "solapur-maharashtra",
    anantapur: "anantapur-andhra pradesh",
    chittoor: "chittoor-andhra pradesh",
    "east godavari": "east godavari-andhra pradesh",
    guntur: "guntur-andhra pradesh",
    krishna: "krishna-andhra pradesh",
    kurnool: "kurnool-andhra pradesh",
    prakasam: "prakasam-andhra pradesh",
    nellore: "spsr nellore-andhra pradesh",
    srikakulam: "srikakulam-andhra pradesh",
    vishakapatanam: "vishakapatanam-andhra pradesh",
    vizianagaram: "vizianagaram-andhra pradesh",
    "west godavari": "west godavari-andhra pradesh",
    kadapa: "kadapa-andhra pradesh",
  }
  
  module.exports = {
    ...
    locationKey,
  }


  const directionsGraphQLQuery = gql`
  query($id: ID!) {
    hospital(id: $id) {
      id
      longitude
      latitude
      name
      address
    }
  }
`

module.exports = {
  ...
  directionsGraphQLQuery,
}