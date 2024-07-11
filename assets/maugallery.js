(function($) {
  // Définition du plugin jQuery
  $.fn.mauGallery = function(options) {
    // Définition des options par défaut
    var defaults = {
      columns: 3,
      lightBox: true,
      lightboxId: null,
      showTags: true,
      tagsPosition: "bottom",
      navigation: true
    };

    // Fusionner les options par défaut avec celles fournies par l'utilisateur
    options = Object.assign({}, defaults, options);

    // Collection pour stocker les tags uniques
    var tagsCollection = [];

    // Itérer sur chaque élément sélectionné par jQuery
    this.each(function() {
      // Créer le wrapper de ligne s'il n'existe pas
      createRowWrapper(this);

      // Créer la lightbox si activée
      if (options.lightBox) {
        createLightBox(this, options.lightboxId, options.navigation);
      }

      // Ajouter des écouteurs d'événements
      listeners(options);

      // Sélectionner tous les éléments .gallery-item à l'intérieur de l'élément actuel
      var galleryItems = this.querySelectorAll(".gallery-item");

      // Parcourir chaque élément .gallery-item
      galleryItems.forEach(function(item) {
        // Appliquer les classes et le comportement responsif pour les images
        responsiveImageItem(item);

        // Déplacer l'élément dans le wrapper de ligne
        moveItemInRowWrapper(item);

        // Encapsuler l'élément dans une colonne en fonction du nombre de colonnes spécifié
        wrapItemInColumn(item, options.columns);

        // Collecter les tags uniques si l'option showTags est activée
        var theTag = item.dataset.galleryTag;
        if (options.showTags && theTag !== undefined && tagsCollection.indexOf(theTag) === -1) {
          tagsCollection.push(theTag);
        }
      });

      // Afficher les tags s'ils sont activés
      if (options.showTags) {
        showItemTags(this, options.tagsPosition, tagsCollection);
      }

      // Afficher l'élément courant avec une animation de fondu
      this.style.display = 'block';
    });

    // Fonction pour créer le wrapper de ligne s'il n'existe pas
    function createRowWrapper(element) {
      if (!element.querySelector('.row')) {
        var rowWrapper = document.createElement('div');
        rowWrapper.classList.add('gallery-items-row', 'row');
        element.appendChild(rowWrapper);
      }
    }

    // Fonction pour encapsuler un élément dans une colonne en fonction du nombre de colonnes
    function wrapItemInColumn(element, columns) {
      if (typeof columns === 'number') {
        var colClass = 'item-column mb-4 col-' + Math.ceil(12 / columns);
        var columnWrapper = document.createElement('div');
        columnWrapper.classList.add(colClass);
        element.parentNode.insertBefore(columnWrapper, element);
        columnWrapper.appendChild(element);
      } else if (typeof columns === 'object') {
        // Gérer les colonnes responsives ici
      } else {
        console.error('Columns should be defined as numbers or objects.');
      }
    }

    // Fonction pour déplacer un élément dans le wrapper de ligne
    function moveItemInRowWrapper(element) {
      var rowWrapper = document.querySelector('.gallery-items-row');
      rowWrapper.appendChild(element);
    }

    // Fonction pour appliquer la classe img-fluid aux images
    function responsiveImageItem(element) {
      if (element.tagName === 'IMG') {
        element.classList.add('img-fluid');
      }
    }

    // Fonction pour créer la lightbox si activée
    function createLightBox(gallery, lightboxId, navigation) {
      gallery.insertAdjacentHTML('beforeend', `<div class="modal fade" id="${lightboxId ? lightboxId : "galleryLightbox"}" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            ${navigation ? '<div class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;">&lt;</div>' : '<span style="display:none;" />'}
                            <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique"/>
                            ${navigation ? '<div class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;}">&gt;</div>' : '<span style="display:none;" />'}
                        </div>
                    </div>
                </div>
            </div>`);
    }

    // Fonction pour afficher les tags si activés
    function showItemTags(gallery, position, tags) {
      var tagItems =
        '<li class="nav-item"><span class="nav-link active active-tag"  data-images-toggle="all">Tous</span></li>';

      tags.forEach(function(value) {
        tagItems += `<li class="nav-item active">
                <span class="nav-link"  data-images-toggle="${value}">${value}</span></li>`;
      });

      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.insertAdjacentHTML('beforeend', tagsRow);
      } else if (position === "top") {
        gallery.insertAdjacentHTML('afterbegin', tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    }

    // Fonction pour ajouter des écouteurs d'événements
    function listeners(options) {
      // Ajouter un écouteur d'événement de clic sur tous les éléments .gallery-item
      document.querySelectorAll(".gallery-item").forEach(function(item) {
        item.addEventListener('click', function() {
          // Ouvrir la lightbox si l'option lightBox est activée et si l'élément cliqué est une image
          if (options.lightBox && this.tagName === "IMG") {
            openLightBox(this, options.lightboxId);
          } else {
            return;
          }
        });
      });

      // Ajouter un écouteur d'événement de clic sur l'élément .gallery pour filtrer par tag ou naviguer dans la lightbox
      document.querySelector('.gallery').addEventListener('click', function(event) {
        var target = event.target;
        if (target.classList.contains('nav-link')) {
          filterByTag(target);
        } else if (target.classList.contains('mg-prev')) {
          prevImage();
        } else if (target.classList.contains('mg-next')) {
          nextImage();
        }
      });
    }

    // Fonction pour ouvrir la lightbox avec l'image cliquée
    function openLightBox(element, lightboxId) {
      document.getElementById(lightboxId)
        .querySelector(".lightboxImage")
        .setAttribute("src", element.getAttribute("src"));
      document.getElementById(lightboxId).classList.add('show');
    }

    // Fonction pour passer à l'image précédente dans la lightbox
    function prevImage() {
      var activeImage = document.querySelector(".lightboxImage");
      var activeTag = document.querySelector(".tags-bar span.active-tag").dataset.imagesToggle;
      var imagesCollection = [];

      // Collecter toutes les images en fonction du tag actif ou "all" si aucun tag n'est actif
      if (activeTag === "all") {
        document.querySelectorAll(".item-column img").forEach(function(img) {
          imagesCollection.push(img);
        });
      } else {
        document.querySelectorAll(".item-column img").forEach(function(img) {
          if (img.dataset.galleryTag === activeTag) {
            imagesCollection.push(img);
          }
        });
      }

      // Trouver l'index de l'image actuellement affichée dans la collection d'images
      var index = Array.from(imagesCollection).findIndex(function(img) {
        return img.getAttribute("src") === activeImage.getAttribute("src");
      });

      // Calculer l'index de l'image précédente dans la collection
      var prevIndex = (index - 1 + imagesCollection.length) % imagesCollection.length;
      var prev = imagesCollection[prevIndex];
      activeImage.setAttribute("src", prev.getAttribute("src"));
    }

    // Fonction pour passer à l'image suivante dans la lightbox
    function nextImage() {
      var activeImage = document.querySelector(".lightboxImage");
      var activeTag = document.querySelector(".tags-bar span.active-tag").dataset.imagesToggle;
      var imagesCollection = [];

      // Collecter toutes les images en fonction du tag actif ou "all" si aucun tag n'est actif
      if (activeTag === "all") {
        document.querySelectorAll(".item-column img").forEach(function(img) {
          imagesCollection.push(img);
        });
      } else {
        document.querySelectorAll(".item-column img").forEach(function(img) {
          if (img.dataset.galleryTag === activeTag) {
            imagesCollection.push(img);
          }
        });
      }

      // Trouver l'index de l'image actuellement affichée dans la collection d'images
      var index = Array.from(imagesCollection).findIndex(function(img) {
        return img.getAttribute("src") === activeImage.getAttribute("src");
      });

      // Calculer l'index de l'image suivante dans la collection
      var nextIndex = (index + 1) % imagesCollection.length;
      var next = imagesCollection[nextIndex];
      activeImage.setAttribute("src", next.getAttribute("src"));
    }

    // Fonction pour filtrer les images par tag
    function filterByTag(target) {
      // Ne rien faire si le tag est déjà actif
      if (target.classList.contains("active-tag")) {
        return;
      }

      // Désélectionner tous les tags actifs
      document.querySelector(".active-tag").classList.remove("active", "active-tag");

      // Sélectionner et activer le tag cliqué
      target.classList.add("active", "active-tag");

      // Récupérer le tag à filtrer
      var tag = target.dataset.imagesToggle;

      // Afficher ou masquer les éléments .gallery-item en fonction du tag sélectionné
      document.querySelectorAll(".gallery-item").forEach(function(item) {
        item.parentNode.style.display = 'none';
        if (tag === "all" || item.dataset.galleryTag === tag) {
          item.parentNode.style.display = 'block';
        }
      });
    }
  };
})(window.jQuery);