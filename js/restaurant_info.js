let restaurant;
var map;

/**
 * Registering a Service Worker if supported.
 */
if ('serviceWorker' in navigator) {
    var serviceWorkerRegistration = navigator.serviceWorker.register('sw.js');
}

document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    }
  });
  const showMapButton = document.getElementById('show-map-button');
  showMapButton.addEventListener('click', event => {
    event.preventDefault();

    const showMapButton = event.target;
    showMapButton.classList.add('fade-away');
    setTimeout(() => showMapButton.parentNode.removeChild(showMapButton), 300);

    const mapContainer = document.getElementById('map-container');
    mapContainer.classList.add('show');
    scroll(0, 0);

    const script = document.createElement('script');
    script.setAttribute('async', 'true');
    script.setAttribute('defer', 'true');
    script.setAttribute('src', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBGmdiqzahVQpOBRZwTI9In1g7kErNASWU&libraries=places&callback=initMap');
    const lastScript = document.querySelector('script[src="js/restaurant_info.js"]');
    lastScript.parentNode.insertBefore(script, lastScript.nextSibling);
  });
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  new Promise(() => {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: self.restaurant.latlng,
      scrollwheel: false
    });

    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);

    google.maps.event.addListener(self.map, 'tilesloaded', function() {
      const iframe = document.querySelector('#map iframe');
      iframe.title = 'Google Maps';
    });
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();

      //Fill breadcrumb and upon finish apply Google Map avoiding focus feature.
      fillBreadcrumb()
          .then(
            aElement => {
              const favoriteButton = document.getElementById('favorite-button');
              aElement.onkeydown = function (event) {
                  if(!event.shiftKey && event.keyCode === 9) {
                      event.preventDefault();
                    favoriteButton.focus();
                  }
              };
              favoriteButton.onkeydown = function (event) {
                  if(event.shiftKey && event.keyCode === 9) {
                      event.preventDefault();
                      aElement.focus();
                  }
              };
            },
            errMessage => {
                console.log(errMessage);
            }
          );
      callback(null, restaurant)
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  const buttonContainer = document.getElementById('restaurant-header');
  buttonContainer.appendChild(createFavoriteButton());

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Restaurant ${restaurant.name}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.setAttribute('aria-label', `The restaurant's cuisine is ${restaurant.cuisine_type}`);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    let restaurantOperatingHours = operatingHours[key].split(', ');
    let weekDay = key;

    for (let hoursLine of restaurantOperatingHours) {
      hours.appendChild( buildRestaurantHoursTableRow(weekDay, hoursLine) );
      weekDay = '';
    }
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
buildRestaurantHoursTableRow = (weekDay, operatingTime) => {
  const row = document.createElement('tr');

  const day = document.createElement('td');
  day.innerHTML = weekDay;
  row.appendChild(day);

  const time = document.createElement('td');
  time.innerHTML = operatingTime;
  row.appendChild(time);

  return row;
};

/**
 * Create favorite button.
 */
createFavoriteButton = (restaurant = self.restaurant) => {
  const favoriteButton = document.createElement('button');
  restaurant.is_favorite = restaurant.is_favorite ? restaurant.is_favorite : false;
  favoriteButton.setAttribute('id', 'favorite-button');
  favoriteButton.setAttribute('role', 'switch');
  favoriteButton.setAttribute('aria-label', restaurant.is_favorite.toString() === 'true' ? 'Un-favorite this restaurant' : 'Favorite this restaurant');
  favoriteButton.setAttribute('aria-checked', restaurant.is_favorite.toString());
  favoriteButton.innerHTML = restaurant.is_favorite.toString() === 'true' ? '❤️' : '🖤';

  favoriteButton.addEventListener('focusout', (event) => {
    event.target.classList.remove('outline-remove');
  });

  favoriteButton.addEventListener('mouseenter', (event) => {
    event.target.classList.add('outline-remove');

    if (restaurant.is_favorite.toString() === 'true') {
      event.target.innerHTML = '💔';
    } else event.target.innerHTML = '💖';
  });

  favoriteButton.addEventListener('mouseleave', (event) => {
    if (restaurant.is_favorite.toString() === 'true') {
      event.target.innerHTML = '❤️';
    } else event.target.innerHTML = '🖤';
  });

  favoriteButton.addEventListener('keydown', (event) => {

    if (event.keyCode === 13 || event.keyCode === 32) {
      event.target.classList.remove('outline-remove');
    }
  });

  favoriteButton.addEventListener('click', (event) => {
    event.preventDefault();
    self.restaurant.is_favorite = self.restaurant.is_favorite.toString() !== 'true';
    favoriteButton.setAttribute('aria-label', self.restaurant.is_favorite.toString() === 'true' ? 'Un-favorite this restaurant' : 'Favorite this restaurant');
    favoriteButton.setAttribute('aria-checked', self.restaurant.is_favorite.toString());

    event.target.classList.add('fade-away');
    setTimeout(() => event.target.classList.remove('fade-away'), 300);

    if (restaurant.is_favorite.toString() === 'true') {
      event.target.innerHTML = '❤️';
    } else event.target.innerHTML = '🖤';

    DBHelper.toggleFavorite(restaurant = self.restaurant, (hasFailed) => {
      if (hasFailed) {
        serviceWorkerRegistration
          .then(registration => navigator.serviceWorker.ready)
          .then(registration => { // register sync
            registration.sync.register(`favorite?${restaurant.id}&${restaurant.is_favorite}`).then(() => {
              console.log('Toggle favorite sync registered');
            });
          });
      }
    });
  });
  return favoriteButton;
};

/**
 * Create form toggle button.
 */
createFormToggleButton = () => {
  const formToggleButton = document.createElement('button');
  formToggleButton.classList.add('button');
  formToggleButton.setAttribute('id', 'form-toggle-button');
  formToggleButton.setAttribute('role', 'switch');
  formToggleButton.setAttribute('aria-checked', 'false');
  formToggleButton.innerHTML = 'Write a review ▼';

  formToggleButton.addEventListener('click', (event) => {
    event.preventDefault();
    const button = event.target;

    const reviewFormContainer = document.getElementById('review-form-container');
    reviewFormContainer.classList.toggle('show');

    const isShown = reviewFormContainer.classList.contains('show');

    button.innerHTML = isShown ? 'Hide ▲' : 'Write a review ▼';
    button.setAttribute('aria-checked', isShown.toString());
  });
  return formToggleButton;
};

/**
 * Remove from data possible XSS.
 */
protectFromXSS = (value) => {
  return value.toString().replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;').replace("'",'&#x27').replace('/','&#x2F');
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const buttonContainer = document.getElementById('reviews-header');
  buttonContainer.appendChild(createFormToggleButton());
  const reviewForm = document.getElementById('review-form');

  reviewForm.addEventListener('submit', event => {
    console.log('Submit event fired');
    event.preventDefault();

    const restaurant_id = parseInt(self.restaurant.id);
    const name = protectFromXSS(document.getElementById('review-form-name').value);
    const rating = parseInt(protectFromXSS(document.getElementById('review-form-rating').value));
    const comments = protectFromXSS(document.getElementById('review-form-comments').value);
    const reviewData = {restaurant_id, name, rating, comments};

    DBHelper.postReview(reviewData, (hasFailed, review) => {
      const reviewForm = document.getElementById('review-form-container');
      reviewForm.parentNode.insertBefore(createReviewHTML(review), reviewForm.nextSibling);
      document.getElementById('form-toggle-button').click();
      if (hasFailed) {
        serviceWorkerRegistration
          .then(registration => navigator.serviceWorker.ready)
          .then(registration => { // register sync
            registration.sync.register('post-review').then(() => {
              console.log('Post review sync registered');
            });
          });
        const connectionProblem = document.createElement('p');
        connectionProblem.setAttribute('id', 'connection-problem-alert');
        connectionProblem.setAttribute('role', 'alert');
        connectionProblem.innerHTML = "You're currently offline, but we got you covered and as soon as you get online your review will be posted to our server, please do not resubmit.";
        const closeAlert = document.createElement('a');
        closeAlert.setAttribute('href', '');
        closeAlert.setAttribute('id', 'close-alert');
        closeAlert.setAttribute('role', 'button');
        closeAlert.setAttribute('aria-label', 'Got it. Close the alert.');
        closeAlert.innerHTML = 'Got it';
        closeAlert.addEventListener('click', (event) => {
          event.preventDefault();
          document.getElementById('reviews-list').removeChild(event.target.parentNode);
        });
        connectionProblem.appendChild(closeAlert);
        reviewForm.parentNode.insertBefore(connectionProblem, reviewForm.nextSibling);
      }
    });
  });

  const reviewFormDate = document.getElementById('review-form-date');
  reviewFormDate.innerHTML = DBHelper.dateForReview({updatedAt: new Date()});

  DBHelper.fetchReviewsForARestaurant(self.restaurant.id, (error, reviews) => {
    if (error) { // Got an error!
      console.error(error);
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
    } else {

      const ul = document.getElementById('reviews-list');

      let reviewsByDate = [];
      for (const review of reviews) {
        reviewsByDate.push(review);
      }

      DBHelper.fetchDelayedReviewsForARestaurant(self.restaurant.id, (reviews) => {

        if (reviews && reviews.length >= 1) {
          for (const review of reviews) {
            reviewsByDate.push(review);
          }
        }

        reviewsByDate.sort(function(a, b) {
          let firstDate = new Date(a.updatedAt);
          let secondDate = new Date(b.updatedAt);

          return secondDate.getTime() - firstDate.getTime();
        });

        reviewsByDate.forEach(review => {
          ul.appendChild(createReviewHTML(review));
        });

        container.appendChild(ul);

      });
    }
  });
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const header = document.createElement('h4');
  header.classList.add('review-header');
  li.appendChild(header);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.classList.add('review-name');
  header.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = DBHelper.dateForReview(review);
  date.classList.add('review-date');

  header.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add('review-rating');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add('review-comments');
  li.appendChild(comments);

  return li;
};

/**
 *  Return a Promise adding restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
    return new Promise((resolve, reject) => {
        const breadcrumb = document.getElementById('breadcrumb');
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = window.location.href;
        a.setAttribute('aria-current', 'page');
        a.innerHTML =  restaurant.name;
        li.appendChild(a);
        breadcrumb.appendChild(li);
        a.parentNode === li ? resolve(a) : reject('An error occurred while appending <a> to <li>');
    }).then(aElement => aElement, error => {console.log(error);});
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
