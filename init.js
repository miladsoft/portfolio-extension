// Initialize view mode
const isSidebar = window.location.search.includes('view=sidebar');

document.addEventListener('DOMContentLoaded', () => {
    document.body.className = isSidebar ? 'sidebar-view' : 'popup-view';
    // Adjust height for popup
    if (!isSidebar) {
        document.body.style.height = '500px';
        document.body.style.width = '360px';
    }
});
