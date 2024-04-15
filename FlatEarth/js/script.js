// Get references to the sidebar and content elements
const sidebar = document.querySelector('.sidebar');
const content = document.querySelector('.content');

// Function to toggle the sidebar open/closed
function toggleSidebar() {
    sidebar.classList.toggle('open');
    content.classList.toggle('open');

    // if closing sidebar, simulate escape key press
    if (!sidebar.classList.contains('open')) {
        document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
        // also set close button to have 10 top and left
        document.querySelector('.close-btn').style.top = '0px';
        document.querySelector('.close-btn').style.right = '0px';
    } else {
        // if opening sidebar, set close button to have 0 top and right
        document.querySelector('.close-btn').style.top = '10px';
        document.querySelector('.close-btn').style.right = '10px';
    }
}