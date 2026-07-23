import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_DEALERS_API = 'https://www.ankanghosh.in/api/static/dealers';
const DEFAULT_INVENTORY_API = 'https://www.ankanghosh.in/api/static/inventory';

/**
 * Format currency to INR format
 */
function formatPrice(amount, currency = 'INR') {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Create a dealer card element
 */
function createDealerCard(dealer, inventoryList) {
  const card = document.createElement('div');
  card.className = 'dealer-card';
  card.dataset.city = dealer.city || '';
  card.dataset.dealerId = dealer.dealerId || '';

  const header = document.createElement('div');
  header.className = 'dealer-card-header';

  const nameEl = document.createElement('h3');
  nameEl.className = 'dealer-name';
  nameEl.textContent = dealer.name;

  const cityTag = document.createElement('span');
  cityTag.className = 'dealer-city-tag';
  cityTag.textContent = dealer.city;

  header.append(nameEl, cityTag);

  const body = document.createElement('div');
  body.className = 'dealer-card-body';

  const details = document.createElement('div');
  details.className = 'dealer-details';

  if (dealer.pin) {
    const pinEl = document.createElement('p');
    pinEl.className = 'dealer-info dealer-pin';
    pinEl.innerHTML = `<span class="icon-location">📍</span> PIN: ${dealer.pin}`;
    details.append(pinEl);
  }

  if (dealer.phone) {
    const phoneEl = document.createElement('p');
    phoneEl.className = 'dealer-info dealer-phone';
    const phoneLink = document.createElement('a');
    phoneLink.href = `tel:${dealer.phone.replace(/[^+\d]/g, '')}`;
    phoneLink.textContent = dealer.phone;
    phoneEl.append(document.createTextNode('📞 Phone: '), phoneLink);
    details.append(phoneEl);
  }

  if (dealer.lat && dealer.lng) {
    const mapEl = document.createElement('p');
    mapEl.className = 'dealer-info dealer-map-link';
    const mapLink = document.createElement('a');
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${dealer.lat},${dealer.lng}`;
    mapLink.target = '_blank';
    mapLink.rel = 'noopener noreferrer';
    mapLink.textContent = 'View on Google Maps ↗';
    mapEl.append(mapLink);
    details.append(mapEl);
  }

  body.append(details);

  if (inventoryList && inventoryList.length > 0) {
    const inventorySection = document.createElement('div');
    inventorySection.className = 'dealer-inventory';

    const invTitle = document.createElement('h4');
    invTitle.className = 'inventory-title';
    invTitle.textContent = 'Available Vehicle Models';
    inventorySection.append(invTitle);

    const invGrid = document.createElement('div');
    invGrid.className = 'inventory-grid';

    inventoryList.forEach((item) => {
      const invItem = document.createElement('div');
      invItem.className = 'inventory-item';

      const modelInfo = document.createElement('div');
      modelInfo.className = 'inventory-model-info';

      const modelName = document.createElement('span');
      modelName.className = 'inventory-model-name';
      modelName.textContent = `${item.model} ${item.variant}`;

      const price = document.createElement('span');
      price.className = 'inventory-price';
      price.textContent = `${formatPrice(item.exShowroomPrice, item.currency)} (Ex-Showroom)`;

      modelInfo.append(modelName, price);

      const statusBadge = document.createElement('span');
      const isStock = item.availability === 'inStock';
      statusBadge.className = `inventory-badge ${isStock ? 'status-in-stock' : 'status-limited'}`;
      statusBadge.textContent = isStock ? 'In Stock' : 'Limited Stock';

      invItem.append(modelInfo, statusBadge);
      invGrid.append(invItem);
    });

    inventorySection.append(invGrid);
    body.append(inventorySection);
  }

  const footer = document.createElement('div');
  footer.className = 'dealer-card-footer';

  if (dealer.phone) {
    const callBtn = document.createElement('a');
    callBtn.className = 'button primary dealer-call-btn';
    callBtn.href = `tel:${dealer.phone.replace(/[^+\d]/g, '')}`;
    callBtn.textContent = 'Contact Dealer';
    footer.append(callBtn);
  }

  card.append(header, body, footer);
  return card;
}

/**
 * Filter dealers by city and search query
 */
function applyFilters(container, selectedCity, searchQuery) {
  const cards = container.querySelectorAll('.dealer-card');
  let visibleCount = 0;

  cards.forEach((card) => {
    const matchesCity = !selectedCity || card.dataset.city === selectedCity;
    const cardText = card.textContent.toLowerCase();
    const matchesSearch = !searchQuery || cardText.includes(searchQuery.toLowerCase());

    if (matchesCity && matchesSearch) {
      card.style.display = '';
      visibleCount += 1;
    } else {
      card.style.display = 'none';
    }
  });

  const emptyMsg = container.querySelector('.dealers-empty');
  if (emptyMsg) {
    emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

/**
 * Main decorate function for Dealers block
 * @param {Element} block
 */
export default async function decorate(block) {
  // Extract custom API URLs from authored block content if provided
  let dealersApiUrl = DEFAULT_DEALERS_API;
  let inventoryApiUrl = DEFAULT_INVENTORY_API;

  const links = [...block.querySelectorAll('a')];
  if (links.length >= 1) dealersApiUrl = links[0].href;
  if (links.length >= 2) inventoryApiUrl = links[1].href;

  // Header content preservation
  const headerContent = document.createElement('div');
  headerContent.className = 'dealers-header-content';
  [...block.children].forEach((row) => {
    moveInstrumentation(row, headerContent);
    while (row.firstElementChild) {
      headerContent.append(row.firstElementChild);
    }
  });

  block.textContent = '';
  if (headerContent.children.length > 0) {
    block.append(headerContent);
  } else {
    const defaultTitle = document.createElement('h2');
    defaultTitle.className = 'dealers-main-title';
    defaultTitle.textContent = 'Authorized Dealers & Inventory';
    block.append(defaultTitle);
  }

  // Filter toolbar controls
  const toolbar = document.createElement('div');
  toolbar.className = 'dealers-toolbar';

  const searchBox = document.createElement('input');
  searchBox.type = 'text';
  searchBox.className = 'dealers-search-input';
  searchBox.placeholder = 'Search by dealer name, city, or PIN...';
  searchBox.ariaLabel = 'Search dealers';

  const citySelect = document.createElement('select');
  citySelect.className = 'dealers-city-select';
  citySelect.ariaLabel = 'Filter by City';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'All Cities';
  citySelect.append(defaultOption);

  toolbar.append(searchBox, citySelect);
  block.append(toolbar);

  // Grid container with loading skeleton
  const grid = document.createElement('div');
  grid.className = 'dealers-grid';

  const skeleton = document.createElement('div');
  skeleton.className = 'dealers-loading';
  skeleton.innerHTML = `
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  `;
  grid.append(skeleton);
  block.append(grid);

  const emptyMsg = document.createElement('div');
  emptyMsg.className = 'dealers-empty';
  emptyMsg.textContent = 'No dealers found matching your search criteria.';
  emptyMsg.style.display = 'none';
  block.append(emptyMsg);

  try {
    const [dealersRes, inventoryRes] = await Promise.all([
      fetch(dealersApiUrl),
      fetch(inventoryApiUrl),
    ]);

    if (!dealersRes.ok || !inventoryRes.ok) {
      throw new Error('Failed to fetch dealer or inventory data');
    }

    const dealersData = await dealersRes.json();
    const inventoryData = await inventoryRes.json();

    const dealers = dealersData.data || [];
    const inventory = inventoryData.data || [];

    grid.textContent = '';

    if (dealers.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }

    // Extract unique cities for filter dropdown
    const cities = [...new Set(dealers.map((d) => d.city).filter(Boolean))].sort();
    cities.forEach((city) => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.append(option);
    });

    dealers.forEach((dealer) => {
      const card = createDealerCard(dealer, inventory);
      grid.append(card);
    });

    // Attach event listeners for real-time filtering
    const triggerFilter = () => {
      applyFilters(grid, citySelect.value, searchBox.value);
    };

    searchBox.addEventListener('input', triggerFilter);
    citySelect.addEventListener('change', triggerFilter);
  } catch (err) {
    grid.textContent = '';
    const errorContainer = document.createElement('div');
    errorContainer.className = 'dealers-error';
    errorContainer.textContent = 'Unable to load dealer information at this time. Please try again later.';
    grid.append(errorContainer);
  }
}
