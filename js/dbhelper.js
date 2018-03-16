/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
      const port = 1337; // Change this to your server port
      return `http://localhost:${port}/restaurants`;
  }

  //IndexedDB
  static dbPromise() {
    return idb.open('rr', 1, function(upgradeDb) {
      upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    //Return restaurants from database if applicable
    DBHelper.dbPromise().then(function(db) {
      if (!db) return;

      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      return store.getAll();
    }).then(restaurants => {
      if(restaurants && restaurants.length >= 10) {
        return callback(null, restaurants);
      } else {
        fetch(DBHelper.DATABASE_URL)
          .then(
            function(response) {
              if (response.status !== 200) {
                const error = 'Looks like there was a problem. Status Code: ' + response.status;
                console.log(error);
                return callback(error, null);
              }

              // Examine the text in the response
              response.json().then(function(restaurants) {
                DBHelper.dbPromise().then(function(db) {
                  if (!db) return;

                  const tx = db.transaction('restaurants', 'readwrite');
                  const store = tx.objectStore('restaurants');
                  for (let restaurant of restaurants) {
                    store.put(restaurant);
                  }
                });
                return callback(null, restaurants);
              });
            }
          )
          .catch(function(err) {
            console.log('Fetch Error :-S', err);
          });
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // Fetch restaurant by id with proper error handling.
    DBHelper.dbPromise().then(function(db) {
      if (!db) return;

      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      return store.get(id);
    }).then(restaurant => {
      if(restaurant) {
        return callback(null, restaurant);
      } else {
        fetch(`${DBHelper.DATABASE_URL}/${id}`)
          .then(
            function(response) {
              if (response.status !== 200) {
                const error = 'Looks like there was a problem. Status Code: ' + response.status;
                console.log(error);
                return callback(error, null);
              }

              // Examine the text in the response
              response.json().then(function(restaurant) {
                DBHelper.dbPromise().then(function(db) {
                  if (!db) return;

                  const tx = db.transaction('restaurants', 'readwrite');
                  const store = tx.objectStore('restaurants');
                  store.put(restaurant);
                });
                return callback(null, restaurant);
              });
            }
          )
          .catch(function(err) {
            console.log('Fetch Error :-S', err);
          });
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return restaurant.photograph ? `/img/${restaurant.photograph}.webp` : '/img/image-error.svg';
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
