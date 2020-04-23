'use strict';

$('#showUpdateInfo').on('click', () => {
  $('#details').hide();
  $('#updateForm').show();
});

$('.addToCollection').on('click', () => {
  alert('Book Added to collection');
});

$('#deleteButton').click(() =>{
  window.open('/');
  location.reload();
});
