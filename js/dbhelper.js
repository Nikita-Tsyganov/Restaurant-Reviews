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
      return `http://localhost:${port}/`;
  }

  //IndexedDB
  static dbPromise() {
    return idb.open('rr', 1, function(upgradeDb) {
      upgradeDb.createObjectStore('restaurants', {keyPath: 'id'}).createIndex('is_favorite', 'is_favorite');
      upgradeDb.createObjectStore('reviews', {keyPath: 'id'}).createIndex('restaurant_id', 'restaurant_id');
      upgradeDb.createObjectStore('delayed-reviews', {autoIncrement: true, keyPath: 'id'}).createIndex('restaurant_id', 'restaurant_id');
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
        fetch(`${DBHelper.DATABASE_URL}restaurants/`)
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
   * Fetch all favorite restaurants.
   */
  static fetchAllFavoriteRestaurants(callback) {
    //Return restaurants from database if applicable
    DBHelper.dbPromise().then(function(db) {
      if (!db) return;

      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      const isFavoriteIndex = store.index('is_favorite');

      return isFavoriteIndex.getAll(true);
    }).then(restaurants => {
      if(restaurants && restaurants.length >= 1) {
        return callback(null, restaurants);
      } else {
        fetch(`${DBHelper.DATABASE_URL}restaurants/?is_favorite=true`)
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
        fetch(`${DBHelper.DATABASE_URL}restaurants/${id}`)
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
   * Update restaurant.
   */
  static updateRestaurant(restaurant) {
    DBHelper.dbPromise().then(function(db) {
      if (!db) return;

      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      store.put(restaurant);
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
        const results = restaurants.filter(r => r.cuisine_type === cuisine);
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
        const results = restaurants.filter(r => r.neighborhood === neighborhood);
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
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type === cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood === neighborhood);
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
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
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
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    //Return reviews from database if applicable
    DBHelper.dbPromise().then(function(db) {
      if (!db) return;

      const tx = db.transaction('reviews');
      const store = tx.objectStore('reviews');
      return store.getAll();
    }).then(reviews => {
      if(reviews && reviews.length >= 30) {
        return callback(null, reviews);
      } else {
        fetch(`${DBHelper.DATABASE_URL}reviews/`)
          .then(
            function(response) {
              if (response.status !== 200) {
                const error = 'Looks like there was a problem. Status Code: ' + response.status;
                console.log(error);
                return callback(error, null);
              }

              // Examine the text in the response
              response.json().then(function(reviews) {
                DBHelper.dbPromise().then(function(db) {
                  if (!db) return;

                  const tx = db.transaction('reviews', 'readwrite');
                  const store = tx.objectStore('reviews');
                  for (let review of reviews) {
                    store.put(review);
                  }
                });
                return callback(null, reviews);
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
   * Fetch all reviews for a restaurant.
   */
  static fetchReviewsForARestaurant(restaurantID, callback) {
    //Return reviews from database if applicable
    DBHelper.dbPromise().then(function(db) {
      if (!db) return;

      const tx = db.transaction('reviews');
      const store = tx.objectStore('reviews');
      const restaurantIDIndex = store.index('restaurant_id');

      return restaurantIDIndex.getAll(restaurantID);
    }).then(reviews => {
      if(reviews && reviews.length >= 1) {
        return callback(null, reviews);
      } else {
        fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${restaurantID}`)
          .then(
            function(response) {
              if (response.status !== 200) {
                const error = 'Looks like there was a problem. Status Code: ' + response.status;
                console.log(error);
                return callback(error, null);
              }

              // Examine the text in the response
              response.json().then(function(reviews) {
                DBHelper.dbPromise().then(function(db) {
                  if (!db) return;

                  const tx = db.transaction('reviews', 'readwrite');
                  const store = tx.objectStore('reviews');
                  for (let review of reviews) {
                    store.put(review);
                  }
                });
                return callback(null, reviews);
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
   * Fetch all delayed reviews for a restaurant.
   */
  static fetchDelayedReviewsForARestaurant(restaurantID, callback) {
    //Return reviews from database if applicable
    DBHelper.dbPromise().then(function(db) {
      if (!db) return;

      const tx = db.transaction('delayed-reviews');
      const store = tx.objectStore('delayed-reviews');
      const restaurantIDIndex = store.index('restaurant_id');

      return restaurantIDIndex.getAll(restaurantID);
    }).then(reviews => {
      if(reviews && reviews.length >= 1) {
        return callback(reviews);
      } else return callback(null);
    });
  }

  /**
   * Fetch a review by its ID.
   */
  static fetchReviewById(id, callback) {
    // Fetch restaurant by id with proper error handling.
    DBHelper.dbPromise().then(function(db) {
      if (!db) return;

      const tx = db.transaction('reviews');
      const store = tx.objectStore('reviews');
      return store.get(id);
    }).then(review => {
      if(review) {
        return callback(null, review);
      } else {
        fetch(`${DBHelper.DATABASE_URL}reviews/${id}`)
          .then(
            function(response) {
              if (response.status !== 200) {
                const error = 'Looks like there was a problem. Status Code: ' + response.status;
                console.log(error);
                return callback(error, null);
              }

              // Examine the text in the response
              response.json().then(function(review) {
                DBHelper.dbPromise().then(function(db) {
                  if (!db) return;

                  const tx = db.transaction('reviews', 'readwrite');
                  const store = tx.objectStore('reviews');
                  store.put(review);
                });
                return callback(null, review);
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
   * Post a review.
   */
  static postReview(reviewData, callback) {

    fetch('http://localhost:1337/reviews/', {
      method: 'POST',
      body: JSON.stringify(reviewData),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(response => {
      if (response.status !== 201) {
        const error = 'Looks like there was a problem. Status Code: ' + response.status;
        console.log(error);
      }
      response.json().then(function(review) {
        DBHelper.dbPromise().then(function(db) {
          if (!db) return;

          const tx = db.transaction('reviews', 'readwrite');
          const store = tx.objectStore('reviews');
          store.put(review);
        });
        return callback(false, review);
      });
    }).catch(function(err) {
      console.log('Fetch Error :-S', err);

      reviewData.createdAt = reviewData.updatedAt = new Date();
      DBHelper.dbPromise().then(function(db) {
        if (!db) return;

        const tx = db.transaction('delayed-reviews', 'readwrite');
        const store = tx.objectStore('delayed-reviews');
        store.put(reviewData);
      });
      return callback(true, reviewData);
    });
  }

  /**
   * Toggle favorite for a restaurant.
   */
  static toggleFavorite(restaurant, callback) {

    fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`, {method: 'PUT'})
      .then(response => {
      if (response.status !== 200) {
        const error = 'Looks like there was a problem. Status Code: ' + response.status;
        console.log(error);
      }
      response.json().then(function(restaurant) {
        DBHelper.updateRestaurant(restaurant);
        return callback(false);
      });
    }).catch(function(err) {
      console.log('Fetch Error :-S', err);

      DBHelper.updateRestaurant(restaurant);
      return callback(true);
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
   * Review formatted date.
   */
  static dateForReview(review) {
    if (!review) return 'Unable to determine the date';
    const date = new Date(review.updatedAt);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    return new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
  }

}
