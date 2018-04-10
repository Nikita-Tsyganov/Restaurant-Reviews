let restaurants,
    neighborhoods,
    cuisines;
var map;
var markers = [];

/**
 * Registering a Service Worker if supported.
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("./sw.js", {scope: './'})
}
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();

  const showMapButton = document.getElementById('show-map-button');
  showMapButton.addEventListener('click', event => {
    event.preventDefault();

    const showMapButton = event.target;
    showMapButton.classList.add("fade-away");
    setTimeout(() => showMapButton.parentNode.removeChild(showMapButton), 300);

    const mapContainer = document.getElementById('map-container');
    mapContainer.classList.add('show');
    scroll(0, 0);

    const script = document.createElement('script');
    script.setAttribute('async', 'true');
    script.setAttribute('defer', 'true');
    script.setAttribute('src', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBovvqHEV47g60VbcHW6auvSoaHxMhHQ2A&libraries=places&callback=initMap');
    const lastScript = document.querySelector('script[src="js/main.js"]');
    lastScript.parentNode.insertBefore(script, lastScript.nextSibling);
  });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  new Promise(() => {
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: loc,
      scrollwheel: false
    });

    addMarkersToMap();

    //Accessibility feature
    google.maps.event.addListener(self.map, "tilesloaded", function() {
      const iframe = document.querySelector('#map iframe');
      iframe.title = "Google Maps";
    });
  });
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  //Reset last row margin adjustments. Needed for function arrangeLastLineOfRestaurants.
  isAdjustmentForBigViewportPerformed = false;
  isAdjustmentForMediumViewportPerformed = false;
  isAdjustmentForSmallViewportPerformed = false;

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  //Lazy load the images
  lazyLoad();
  window.addEventListener('scroll', lazyLoad);
  window.addEventListener('resize', lazyLoad);

  //Fix margin of restaurant items if applicable.
  arrangeLastLineOfRestaurants();

  if (self.map) addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  /*image.src = DBHelper.imageUrlForRestaurant(restaurant);*/
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = "Restaurant " + restaurant.name + " with " + restaurant.cuisine_type + " cuisine.";
  li.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute("aria-label", "To the restaurant " + restaurant.name + " page");
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
};

function isInViewport(element){
  const rect = element.getBoundingClientRect();

  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&

    rect.top <= (
      window.innerHeight ||
      document.documentElement.clientHeight) &&

    rect.left <= (
      window.innerWidth ||
      document.documentElement.clientWidth)
  );
}

function lazyLoad(){
  const images = document.querySelectorAll('img[data-src]');

  for (const image of images) {
    if(isInViewport(image)){
      image.src = image.getAttribute('data-src');
    }
  }
}

/**
 * Dynamically arranges restaurant items in the last row using margin parameter.
 */
function arrangeLastLineOfRestaurants() {
  const restaurantsList = document.querySelectorAll("#restaurants-list li");
  const excessiveItemsRowOfThree = restaurantsList.length % 3;
  const excessiveItemsRowOfTwo = restaurantsList.length % 2;
  if (excessiveItemsRowOfThree === 0 && excessiveItemsRowOfTwo === 0)  return;
  const isViewportBig = window.innerWidth >= 1122;
  const isViewportMedium = window.innerWidth >= 758 && window.innerWidth < 1122;
  const isViewportSmall = window.innerWidth < 758;

  if (isViewportBig) {

    if (isAdjustmentForBigViewportPerformed) return;

    if (isAdjustmentForMediumViewportPerformed) {
        toggleMarginOfLastRowElements(restaurantsList, excessiveItemsRowOfTwo, 2);
        isAdjustmentForMediumViewportPerformed = false;
    }

    if (excessiveItemsRowOfThree !== 0) toggleMarginOfLastRowElements(restaurantsList, excessiveItemsRowOfThree, 3);
    isAdjustmentForBigViewportPerformed = true;
    isAdjustmentForSmallViewportPerformed = false;
  }

  if (isViewportMedium) {

    if (isAdjustmentForMediumViewportPerformed) return;

    if (isAdjustmentForBigViewportPerformed) {
        toggleMarginOfLastRowElements(restaurantsList, excessiveItemsRowOfThree, 3);
        isAdjustmentForBigViewportPerformed = false;
    }

    if (excessiveItemsRowOfTwo !== 0) toggleMarginOfLastRowElements(restaurantsList, excessiveItemsRowOfTwo, 2);
    isAdjustmentForMediumViewportPerformed = true;
    isAdjustmentForSmallViewportPerformed = false;
  }

  if (isViewportSmall) {

    if (isAdjustmentForSmallViewportPerformed) return;

    if (isAdjustmentForMediumViewportPerformed) {
        toggleMarginOfLastRowElements(restaurantsList, excessiveItemsRowOfTwo, 2);
        isAdjustmentForMediumViewportPerformed = false;
    }
    if (isAdjustmentForBigViewportPerformed) {
        toggleMarginOfLastRowElements(restaurantsList, excessiveItemsRowOfThree, 3);
        isAdjustmentForBigViewportPerformed = false;
    }
    isAdjustmentForSmallViewportPerformed = true;
  }
}

//Toggles class with margin parameters for last elements from array depending on amount of items in a row.
function toggleMarginOfLastRowElements (elementsArr, numberOfElements, rowCapacity) {

    let classToApply = "";

    switch(rowCapacity) {
        case 2:
            classToApply = "row-of-two-excessive-items-margin-arrangement";
            break;
        case 3:
            classToApply = "row-of-three-excessive-items-margin-arrangement";
            break;
    }

    for (let i = 0; i < numberOfElements; i++) {
        let item = elementsArr[elementsArr.length - 1 - i];
        item.classList.toggle(classToApply);
    }
}

//Variables necessary for arrangeLastLineOfRestaurants function
let isAdjustmentForBigViewportPerformed = false;
let isAdjustmentForMediumViewportPerformed = false;
let isAdjustmentForSmallViewportPerformed = false;
//Event listener for resize to dynamically arrange the margin of restaurant items.
window.addEventListener("resize", arrangeLastLineOfRestaurants);

window.onload = () => {

    //Preventing Google Maps from being focused
    const siteHeader = document.querySelector("header nav h1 a");
    const neighborhoodsSelect = document.getElementById("neighborhoods-select");
    siteHeader.onkeydown = function (event) {
      if(!event.shiftKey && event.keyCode === 9) {
        event.preventDefault();
        neighborhoodsSelect.focus();
      }
    };
    neighborhoodsSelect.onkeydown = function (event) {
        if(event.shiftKey && event.keyCode === 9) {
            event.preventDefault();
            siteHeader.focus();
        }
    };
};
