
document.addEventListener('DOMContentLoaded', function () {
  // Configuration
  const config = {
    dragSensitivity: 1.0,
    momentumDecay: 0.93,
    cardWidth: 360,
    cardGap: 16,
    edgeResistance: 0.4,
  };

  // DOM elements
  const scrollerContainer = document.getElementById('scrollerContainer');
  const scrollerContent = document.getElementById('scrollerContent');
  const tabButtons = document.querySelectorAll('.tab-btn');

  // State
  let currentPosition = 0;
  let animationFrame = null;
  let maxPosition = 0;
  let minPosition = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartPosition = 0;
  let lastMoveX = 0;
  let lastMoveTime = 0;
  let velocityX = 0;
  let activeTab = 'Sell';
  let products = [];
  let filteredProducts = [];

  // Helper functions
  const getClientX = (e) => e.type.includes('touch') ? e.touches[0].pageX : e.pageX;

  const startDrag = (e) => {
    dragging = true;
    dragStartX = getClientX(e);
    dragStartPosition = currentPosition;
    lastMoveX = dragStartX;
    lastMoveTime = performance.now();
    velocityX = 0;
    cancelAnimation();
    scrollerContent.style.transition = 'none';
  };

  const handleDrag = (e) => {
    if (!dragging) return;
    e.preventDefault();

    const x = getClientX(e);
    const delta = x - dragStartX;
    let newPos = dragStartPosition + delta * config.dragSensitivity;

    if (newPos > maxPosition) {
      newPos = maxPosition + (newPos - maxPosition) * config.edgeResistance;
    } else if (newPos < minPosition) {
      newPos = minPosition + (newPos - minPosition) * config.edgeResistance;
    }

    currentPosition = newPos;
    scrollerContent.style.transform = `translateX(${currentPosition}px)`;

    const now = performance.now();
    const timeDiff = now - lastMoveTime;
    if (timeDiff > 0) {
      const distance = x - lastMoveX;
      velocityX = distance / timeDiff;
      lastMoveX = x;
      lastMoveTime = now;
    }
  };

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    scrollerContent.style.transition = 'transform 0.3s ease-out';

    if (Math.abs(velocityX) > 0.01) {
      applyMomentum();
    } else {
      snapToNearest();
    }
  };

  const applyMomentum = () => {
    velocityX *= config.momentumDecay;
    currentPosition += velocityX * 16;

    if (currentPosition > maxPosition) {
      currentPosition = maxPosition;
      velocityX = 0;
    } else if (currentPosition < minPosition) {
      currentPosition = minPosition;
      velocityX = 0;
    }

    scrollerContent.style.transform = `translateX(${currentPosition}px)`;

    if (Math.abs(velocityX) > 0.1) {
      animationFrame = requestAnimationFrame(applyMomentum);
    } else {
      snapToNearest();
    }
  };

  const snapToNearest = () => {
    const step = config.cardWidth + config.cardGap;
    const snapped = Math.round(currentPosition / step) * step;
    currentPosition = Math.max(minPosition, Math.min(maxPosition, snapped));
    scrollerContent.style.transform = `translateX(${currentPosition}px)`;
  };

  const cancelAnimation = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  };

  const setTab = (tab) => {
    activeTab = tab;

    // Update active tab button
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('active', 'bg-blue-500', 'text-white', 'border-blue-500');
        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
      } else {
        btn.classList.remove('active', 'bg-blue-500', 'text-white', 'border-blue-500');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
      }
    });

    // Filter products
    filteredProducts = products.filter(item => item.status === tab);
    renderProducts();
    initScroller();

    // Scroll to first card
    currentPosition = 0;
    scrollerContent.style.transform = `translateX(${currentPosition}px)`;
  };

  const initScroller = () => {
    if (!scrollerContainer || !scrollerContent) return;

    const containerWidth = scrollerContainer.clientWidth;
    const cardCount = filteredProducts.length;
    const totalWidth = cardCount * (config.cardWidth + config.cardGap) - config.cardGap;

    scrollerContent.style.width = `${totalWidth}px`;

    const contentWidth = totalWidth;
    maxPosition = 0;
    minPosition = containerWidth - contentWidth;

    currentPosition = maxPosition;
    scrollerContent.style.transform = `translateX(${currentPosition}px)`;
  };

  const renderProducts = () => {
    scrollerContent.innerHTML = '';

    filteredProducts.forEach(item => {
      const card = document.createElement('div');
      card.className = 'flex-none w-[360px] bg-gray-50 border border-gray-200 rounded-xl p-2 transition-all hover:-translate-y-0.5 hover:shadow-sm';

      card.innerHTML = `
            <div class="w-full flex gap-1 items-center">
              <div>
                <img src="css/images/circle.png" alt="" width="40" height="40" class="rounded-full">
              </div>
              <div class="w-full text-slate-800 font-medium">
                ${item.stock}
              </div>
              <div class="flex justify-end w-32">
                <span class="px-2 py-2 rounded-xl text-sm font-medium ${item.status === 'Buy' ? 'bg-green-100 text-green-500' :
          item.status === 'Hold' ? 'bg-yellow-100 text-yellow-500' :
            'bg-red-100 text-red-500'
        }">
                  ${item.status}
                </span>
              </div>
            </div>

            <div class="w-full flex justify-between ">
              <div class="w-full p-1">
                <p class="text-sm text-slate-500">LTP</p>
                <p class="text-slate-800">${item.ltp}</p>
              </div>
              <div class="w-full p-1 flex justify-end items-end flex-col">
                <p class="text-sm text-slate-500">Target</p>
                <p class="text-slate-800">${item.target}</p>
              </div>
            </div>

            <div class="w-full flex justify-between">
              <div class="w-full p-1">
                <p class="text-sm text-slate-500">Price at Repco</p>
                <p class="text-slate-800">${item.price_at_reco}</p>
              </div>
              <div class="w-full p-1 flex justify-end items-end flex-col">
                <p class="text-sm text-slate-500">Upside</p>
                <p class="${parseFloat(item.upside?.toString().trim()) < 0 ? 'text-red-500' : 'text-green-500'}">
                  ${item.upside}%
                </p>
              </div>
            </div>

            <div class="w-full p-1 flex gap-1 mt-1">
              <span class="chip"><i class="pi pi-file-pdf"></i> PDF</span>
              <span class="chip"><i class="pi pi-telegram"></i> POST</span>
              <span class="chip"><i class="pi pi-star"></i> CACHE</span>
            </div>

            <div class="w-full p-1">
              <p class="text-lg text-slate-800 font-medium">Author</p>
              <div class="w-full flex gap-2 flex-wrap mt-1">
                ${item.authors.map(author =>
          `<span class="chip">${author}</span>`
        ).join('')}
              </div>
            </div>
          `;

      scrollerContent.appendChild(card);
    });
  };

  // Event listeners
  scrollerContainer.addEventListener('mousedown', startDrag);
  scrollerContainer.addEventListener('touchstart', startDrag, { passive: false });
  scrollerContainer.addEventListener('mousemove', handleDrag);
  scrollerContainer.addEventListener('touchmove', handleDrag, { passive: false });
  scrollerContainer.addEventListener('mouseup', endDrag);
  scrollerContainer.addEventListener('mouseleave', endDrag);
  scrollerContainer.addEventListener('touchend', endDrag);

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  window.addEventListener('resize', initScroller);

  // Fetch and initialize data
  const fetchStockData = async () => {

    

    try {
      const response = await fetch('/data/data.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if(data){
          document.getElementById('loading').classList.add('hidden')
        document.getElementById('content').classList.remove('hidden')
         const order = ['Sell', 'Buy', 'Hold'];
      products = order.flatMap(status => data.filter(item => item.status === status));

      setTab(activeTab);
      }
     
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  fetchStockData();
});


    let allStockData = [];
    let currentFilter = 'All';

   function viewall() {
      document.getElementById('section1').classList.add('hidden');
      document.getElementById('section2').classList.remove('hidden');
      fetchAndRenderGridData();
    }



function viewless() {
  document.getElementById('section1').classList.remove('hidden')
  document.getElementById('section2').classList.add('hidden')
}

   function filterGrid(status) {
      currentFilter = status;
      
      // Update active tab button
      document.querySelectorAll('.tab-filter-btn').forEach(btn => {
        if (btn.dataset.tab === status) {
          btn.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
          btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
        } else {
          btn.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
          btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
        }
      });

      // Filter data
      const filteredData = status === 'All' 
        ? allStockData 
        : allStockData.filter(item => item.status === status);
      
      renderGrid(filteredData);
    }

    // Fetch data and render grid
    async function fetchAndRenderGridData() {
      try {
        const response = await fetch('/data/data.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

        allStockData = data;
        filterGrid(currentFilter); // This will render the grid with initial filter
        
      } catch (error) {
        console.error('Error fetching stock data:', error);
        document.getElementById('viewall').innerHTML = `
          <div class="p-4 text-center text-red-500">
            Error loading data. Please try again later.
          </div>
        `;
      }
    }

function renderGrid(data) {
  const viewallDiv = document.getElementById('viewall');
  
  if (data.length === 0) {
    viewallDiv.innerHTML = `
      <div class="p-8 text-center text-gray-500">
        No ${currentFilter === 'All' ? '' : currentFilter} stocks found
      </div>
    `;
    return;
  }

  const gridContainer = document.createElement('div');
  gridContainer.className = 'grid-view-container'; // Added container class
  
  gridContainer.innerHTML = `
    <ul role="list" class="grid-content mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      ${data.map(item => `
        <li class="col-span-1 px-2 py-2 flex rounded-md border-2">
          <div class="w-full">
            <div class="w-full flex gap-1 items-center">
              <div>
                <img src="css/images/circle.png" alt="" width="40" height="40" class="rounded-full">
              </div>
              <div class="w-full text-slate-800 font-medium">
                ${item.stock}
              </div>
              <div class="flex justify-end w-32">
                <span class="px-2 py-2 rounded-xl text-sm font-medium ${
                  item.status === 'Buy' ? 'bg-green-100 text-green-500' :
                  item.status === 'Hold' ? 'bg-yellow-100 text-yellow-500' :
                  'bg-red-100 text-red-500'
                }">
                  ${item.status}
                </span>
              </div>
            </div>

            <div class="w-full flex justify-between mt-1">
              <div class="w-full p-1">
                <p class="text-sm text-slate-500">LTP</p>
                <p class="text-slate-800">${item.ltp}</p>
              </div>
              <div class="w-full p-1 flex justify-end items-end flex-col">
                <p class="text-sm text-slate-500">Target</p>
                <p class="text-slate-800">${item.target}</p>
              </div>
            </div>

            <div class="w-full flex justify-between">
              <div class="w-full p-1">
                <p class="text-sm text-slate-500">Price at Repco</p>
                <p class="text-slate-800">${item.price_at_reco}</p>
              </div>
              <div class="w-full p-1 flex justify-end items-end flex-col">
                <p class="text-sm text-slate-500">Upside</p>
                <p class="${parseFloat(item.upside?.toString().trim()) < 0 ? 'text-red-500' : 'text-green-500'}">
                  ${item.upside}%
                </p>
              </div>
            </div>

            <div class="w-full p-1 flex gap-1 mt-2">
              <span class="chip"><i class="pi pi-file-pdf"></i> PDF</span>
              <span class="chip"><i class="pi pi-telegram"></i> POST</span>
              <span class="chip"><i class="pi pi-star"></i> CACHE</span>
            </div>

            <div class="w-full p-1">
              <p class="text-lg text-slate-800 font-medium">Author</p>
              <div class="w-full flex gap-2 flex-wrap mt-1">
                ${item.authors.map(author => `<span class="chip">${author}</span>`).join('')}
              </div>
            </div>
          </div>
        </li>
      `).join('')}
    </ul>

    <div class="view-less-container w-full flex justify-end mb-12 p-2 bg-white border-t border-gray-200 sticky bottom-0">
      <p class="text-blue-500 cursor-pointer flex items-center" onclick="viewless()">
        View Less <i class="pi pi-angle-right ml-1"></i>
      </p>
    </div>
  `;
  
  viewallDiv.innerHTML = '';
  viewallDiv.appendChild(gridContainer);
}
  
    document.getElementById('section1').classList.remove('hidden');


   const openBtn = document.getElementById('openDrawer');
  const drawer = document.getElementById('drawer');
  const drawerPanel = document.getElementById('drawerPanel');

  openBtn.addEventListener('click', () => {
    drawer.classList.remove('hidden');
    setTimeout(() => {
      drawerPanel.classList.remove('-translate-x-full');
    }, 10); // short delay to trigger transition
  });

  function closeDrawer() {
    drawerPanel.classList.add('-translate-x-full');
    setTimeout(() => {
      drawer.classList.add('hidden');
    }, 500); // matches the transition duration
  }

  function searchfun(option){
    if(option=='open'){
          document.getElementById('searchcontainer').classList.remove('hidden')
    }
    else{
                document.getElementById('searchcontainer').classList.add('hidden')

    }

  }

  document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('notifyToggle');
    const notifyBox = document.getElementById('notifycontainer');

    // Initially hidden is already set via class, no need to hide again here

    toggleBtn.addEventListener('click', () => {
      notifyBox.classList.toggle('hidden'); // Show/hide on click
    });

    // Optional: click outside to auto-hide
    document.addEventListener('click', function (event) {
      if (!notifyBox.contains(event.target) && !toggleBtn.contains(event.target)) {
        notifyBox.classList.add('hidden');
      }
    });
  });

   document.getElementById('clientid').innerText=localStorage.getItem('mobile')
   function logout(){
    localStorage.removeItem('token')
    localStorage.removeItem('name')
    localStorage.removeItem('mobile')
    window.location.href='/'
   }