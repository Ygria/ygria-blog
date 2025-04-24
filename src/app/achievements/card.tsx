// PokemonCard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSpring, animated, interpolate } from '@react-spring/web'; // Use '@react-spring/web'
import { clamp, round, adjust } from '@/lib/math'; // Adjust path if needed
// import './PokemonCard.css'; // Import your CSS file here

// Assuming these props are passed down from a parent component or context
// interface PokemonCardProps {
//   id?: string;
//   name?: string;
//   number?: string;
//   set?: string;
//   types?: string | string[];
//   subtypes?: string | string[];
//   supertype?: string;
//   rarity?: string;
//   img?: string;
//   back?: string;
//   foil?: string;
//   mask?: string;
//   showcase?: boolean;
//   activeCard: any; // Type this according to your activeCard structure
//   setActiveCard: (card: any | undefined) => void;
//   orientation: any; // Type this according to your orientation store structure
//   resetBaseOrientation: () => void;
// }

// React Spring config mapping (approximate)
const springInteractSettings = { tension: 250, friction: 30 }; // Adjust for feel, Svelte's stiffness/damping maps differently
const springPopoverSettings = { tension: 180, friction: 40 }; // Adjust for feel
const springSnapSettings = { tension: 350, friction: 15 }; // For snapping back

function PokemonCard({
  id = "",
  name = "",
  number: initialNumber = "",
  set = "",
  types: initialTypes = "",
  subtypes: initialSubtypes = "basic",
  supertype: initialSupertype = "pokémon",
  rarity: initialRarity = "common",
  img = "",
  back = "https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg",
  foil = "",
  mask = "",
  showcase = false,

}) {

  const cardRef = useRef(null);
  const repositionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showcaseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const showcaseTimerStartRef = useRef<NodeJS.Timeout | null>(null);
  const showcaseTimerEndRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false); // To prevent initial effect runs if needed

  const [interacting, setInteracting] = useState(false);
  const [isCardActive, setIsCardActive] = useState(false); // Local state reflecting if *this* card is the active one
  const [firstPop, setFirstPop] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true); // Assume visible initially, update with effect
  const [showcaseRunning, setShowcaseRunning] = useState(showcase);
  const [foilStyles, setFoilStyles] = useState({}); // Use object for inline styles

  // Memoize constant calculations
  const { randomSeed, cosmosPosition, img_base } = useMemo(() => {
    const seed = { x: Math.random(), y: Math.random() };
    return {
      randomSeed: seed,
      cosmosPosition: {
        x: Math.floor(seed.x * 734),
        y: Math.floor(seed.y * 1280)
      },
      img_base: img.startsWith("http") ? "" : "https://images.pokemontcg.io/"
    };
  }, [img]); // Only depends on img prop

  const front_img = useMemo(() => img_base + img, [img_base, img]);

  // Memoize derived props processing
  const { rarity, supertype, number, types, subtypes, isTrainerGallery } = useMemo(() => {
    const lowerRarity = initialRarity.toLowerCase();
    const lowerSupertype = initialSupertype.toLowerCase();
    const lowerNumber = initialNumber.toLowerCase();
    const processedTypes = Array.isArray(initialTypes) ? initialTypes.join(" ").toLowerCase() : initialTypes.toLowerCase();
    const processedSubtypes = Array.isArray(initialSubtypes) ? initialSubtypes.join(" ").toLowerCase() : initialSubtypes.toLowerCase();
    const trainerGallery = !!lowerNumber.match(/^[tg]g/i) || !!(id === "swshp-SWSH076" || id === "swshp-SWSH077");
    return {
      rarity: lowerRarity,
      supertype: lowerSupertype,
      number: lowerNumber,
      types: processedTypes,
      subtypes: processedSubtypes,
      isTrainerGallery: trainerGallery,
    };
  }, [initialRarity, initialSupertype, initialNumber, initialTypes, initialSubtypes, id]);

  // --- Animation Springs ---
  const [interactionSpring, interactionApi] = useSpring(() => ({
    rotateX: 0, rotateY: 0,
    glareX: 50, glareY: 50, glareO: 0,
    bgX: 50, bgY: 50,
    config: springInteractSettings,
  }));

  const [popoverSpring, popoverApi] = useSpring(() => ({
    rotateDeltaX: 0, rotateDeltaY: 0,
    translateX: 0, translateY: 0,
    scale: 1,
    config: springPopoverSettings,
  }));

  // --- Interaction Logic ---
  const updateSprings = useCallback((background, rotate, glare, config = springInteractSettings) => {
    interactionApi.start({
      bgX: background.x, bgY: background.y,
      rotateX: rotate.x, rotateY: rotate.y,
      glareX: glare.x, glareY: glare.y, glareO: glare.o,
      config: config,
    });
  }, [interactionApi]);

  const handleInteractEnd = useCallback((delay = 500) => {
    const timeoutId = setTimeout(() => {
      setInteracting(false);
      interactionApi.start({
        rotateX: 0, rotateY: 0,
        glareX: 50, glareY: 50, glareO: 0,
        bgX: 50, bgY: 50,
        config: springSnapSettings, // Use snap config for return
        // react-spring v9+ doesn't have 'soft', just use appropriate config
      });
    }, delay);
    // Store timeout to potentially clear it if needed
    return timeoutId;
  }, [interactionApi]);

  const endShowcase = useCallback(() => {
    if (showcaseRunning) {
      clearTimeout(showcaseTimerEndRef.current);
      clearTimeout(showcaseTimerStartRef.current);
      clearInterval(showcaseIntervalRef.current);
      setShowcaseRunning(false);
      // Ensure card snaps back if showcase is interrupted
      handleInteractEnd(0);
    }
  }, [showcaseRunning, handleInteractEnd]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    endShowcase();
    if (!isVisible || (activeCard && activeCard !== cardRef.current)) { // Compare refs or preferably IDs
      return setInteracting(false);
    }

    setInteracting(true);
    const target = e.currentTarget; // Use currentTarget for the element the listener is attached to
    const rect = target.getBoundingClientRect();
    const clientX = (e.nativeEvent as PointerEvent).clientX; // Use nativeEvent for coordinates
    const clientY = (e.nativeEvent as PointerEvent).clientY;

    const absolute = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    const percent = {
      x: clamp(round((100 / rect.width) * absolute.x)),
      y: clamp(round((100 / rect.height) * absolute.y)),
    };
    const center = {
      x: percent.x - 50,
      y: percent.y - 50,
    };

    updateSprings({
      x: adjust(percent.x, 0, 100, 37, 63),
      y: adjust(percent.y, 0, 100, 33, 67),
    }, {
      x: round(-(center.x / 3.5)),
      y: round(center.y / 2),
    }, {
      x: round(percent.x),
      y: round(percent.y),
      o: 1,
    });
  }, [isVisible, activeCard, updateSprings, endShowcase]);

  const handleMouseOut = useCallback(() => {
    if (interacting) {
      handleInteractEnd();
    }
  }, [interacting, handleInteractEnd]);

  const handleActivate = useCallback(() => {
    if (activeCard && activeCard === cardRef.current) { // Compare refs or IDs
        setActiveCard(undefined);
    } else {
        setActiveCard(cardRef.current); // Or pass ID/data
        resetBaseOrientation();
        if (typeof gtag === 'function') {
          gtag("event", "select_item", {
            item_list_id: "cards_list",
            item_list_name: "Pokemon Cards",
            items: [{
              item_id: id,
              item_name: name,
              item_category: set,
              item_category2: supertype,
              item_category3: subtypes,
              item_category4: rarity
            }]
          });
        }
    }
  }, [activeCard, setActiveCard, resetBaseOrientation, id, name, set, supertype, subtypes, rarity]);

  const handleDeactivate = useCallback(() => { // onBlur handler
    // Only deactivate if *this* card was the active one and focus is lost
    if (isCardActive) {
        handleInteractEnd(100); // Quick snap back if blurred
        // Decide if blur should always deactivate the card
        // setActiveCard(undefined); // Optional: Deactivate on blur
    }
  }, [isCardActive, handleInteractEnd /*, setActiveCard*/]);

  // --- Positioning & Popover Logic ---
  const setCenter = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const view = document.documentElement;

    const delta = {
      x: round(view.clientWidth / 2 - rect.x - rect.width / 2),
      y: round(view.clientHeight / 2 - rect.y - rect.height / 2),
    };
    popoverApi.start({
      translateX: delta.x,
      translateY: delta.y,
      // config: springPopoverSettings // Config applied when popover/retreat called
    });
  }, [popoverApi]);

  const popover = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    let delay = 100;
    const scaleW = (window.innerWidth / rect.width) * 0.9;
    const scaleH = (window.innerHeight / rect.height) * 0.9;
    const scaleF = 1.75;
    const targetScale = Math.min(scaleW, scaleH, scaleF);

    setCenter();

    if (firstPop) {
      delay = 1000; // Svelte delay was 1000
      popoverApi.start({
        rotateDeltaX: 360,
        rotateDeltaY: 0,
        scale: targetScale,
        config: springPopoverSettings,
        delay: 100 // Short delay before popover anim starts
      });
      setFirstPop(false);
    } else {
        popoverApi.start({
            scale: targetScale,
            // rotateDeltaX/Y remain at target from previous state or 0 if retreated
            config: springPopoverSettings,
        });
    }

    handleInteractEnd(delay); // Stop interaction animation after delay
  }, [setCenter, firstPop, popoverApi, handleInteractEnd]);

  const retreat = useCallback(() => {
    popoverApi.start({
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotateDeltaX: 0,
      rotateDeltaY: 0,
      config: { ...springPopoverSettings, tension: 220 }, // Slightly faster retreat
      // react-spring doesn't have 'soft' - adjust config or use immediate: false (default)
    });
    handleInteractEnd(100); // Stop interaction quickly
  }, [popoverApi, handleInteractEnd]);

  const reset = useCallback(() => {
    handleInteractEnd(0);
    popoverApi.start({
      scale: 1,
      translateX: 0, translateY: 0,
      rotateDeltaX: 0, rotateDeltaY: 0,
      immediate: true // Hard reset
    });
    interactionApi.start({
        rotateX: 0, rotateY: 0,
        glareX: 50, glareY: 50, glareO: 0,
        bgX: 50, bgY: 50,
        immediate: true // Hard reset
    });
  }, [handleInteractEnd, popoverApi, interactionApi]);

  // --- Effects ---

  // Handle activeCard changes
  useEffect(() => {
    const thisCardIsActive = activeCard && activeCard === cardRef.current; // Or compare by ID
    setIsCardActive(thisCardIsActive);
    if (thisCardIsActive) {
        popover();
    } else {
        // Check if the component was previously active before retreating
        // This check avoids retreating non-active cards unnecessarily on mount/prop changes
        if (isCardActive && !thisCardIsActive) {
             retreat();
        }
    }
    // isCardActive is derived state, don't include. popover/retreat are callbacks.
  }, [activeCard, popover, retreat,isCardActive]);

  // Handle orientation changes for active card
  const handleOrientation = useCallback((relativeOrientation) => {
      if (!relativeOrientation) return;
      const x = relativeOrientation.gamma;
      const y = relativeOrientation.beta;
      const limit = { x: 16, y: 18 };

      const degrees = {
          x: clamp(x, -limit.x, limit.x),
          y: clamp(y, -limit.y, limit.y)
      };

      // Don't use setInteracting(true) here, orientation is passive
      updateSprings({
          x: adjust(degrees.x, -limit.x, limit.x, 37, 63),
          y: adjust(degrees.y, -limit.y, limit.y, 33, 67),
      }, {
          x: round(degrees.x * -1),
          y: round(degrees.y),
      }, {
          x: adjust(degrees.x, -limit.x, limit.x, 0, 100),
          y: adjust(degrees.y, -limit.y, limit.y, 0, 100),
          o: 1, // Keep glare visible during orientation tilt
      });
  }, [updateSprings]); // Depends only on updateSprings callback


  useEffect(() => {
      if (isCardActive && orientation?.relative) {
        // Don't set interacting=true for orientation
        handleOrientation(orientation.relative);
      }
      // Do NOT add handleOrientation to dependencies - it's stable via useCallback
  }, [isCardActive, orientation,handleOrientation]); // Re-run when card becomes active or orientation changes

  // Visibility change listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      if (!visible) {
        endShowcase();
        reset(); // Reset state when tab becomes hidden
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Set initial visibility state
    handleVisibilityChange();
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clear any pending timeouts from visibility change handler if necessary
      endShowcase();
    };
  }, [reset, endShowcase]); // Add dependencies for used callbacks

  // Reposition on scroll listener
  const handleReposition = useCallback(() => {
    if (repositionTimerRef.current) {
      clearTimeout(repositionTimerRef.current);
    }
    repositionTimerRef.current = setTimeout(() => {
      if (isCardActive) { // Use the local state derived from activeCard prop
        setCenter();
      }
    }, 300);
  }, [isCardActive, setCenter]); // Add dependencies

  useEffect(() => {
    window.addEventListener('scroll', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition);
      if (repositionTimerRef.current) {
        clearTimeout(repositionTimerRef.current);
      }
    };
  }, [handleReposition]); // Add handleReposition dependency


  // Image loading handler
  const handleImageLoad = useCallback(() => {
    setLoading(false);
    if (mask || foil) {
      setFoilStyles({
        '--mask': `url(${mask})`,
        '--foil': `url(${foil})`,
      });
    }
  }, [mask, foil]);

  // Showcase animation effect
  useEffect(() => {
    isMountedRef.current = true; // Mark as mounted
    let localShowcaseRunning = false; // Track running state locally within effect

    if (showcase && isVisible) {
      const s = { tension: 100, friction: 50 }; // Softer config for showcase anim
  
      let r = 0;

      showcaseTimerStartRef.current = setTimeout(() => {
        if (!isMountedRef.current) return; // Check if still mounted
        setInteracting(true);
        // setIsCardActive(true); // Showcase doesn't make it the *globally* active card
        localShowcaseRunning = true;
        setShowcaseRunning(true);

        // Start interval if still visible
        if (document.visibilityState === 'visible') { // Double check visibility
          showcaseIntervalRef.current = setInterval(() => {
            r += 0.05;
            interactionApi.start({
              rotateX: Math.sin(r) * 15, // Reduce rotation slightly
              rotateY: Math.cos(r) * 15,
              glareX: 55 + Math.sin(r) * 45, // Adjust glare range
              glareY: 55 + Math.cos(r) * 45,
              glareO: 0.8,
              bgX: 30 + Math.sin(r) * 20, // Adjust bg range
              bgY: 30 + Math.cos(r) * 20,
              config: s,
            });
          }, 20); // Interval from Svelte

          showcaseTimerEndRef.current = setTimeout(() => {
            if (!isMountedRef.current) return; // Check mount status
            clearInterval(showcaseIntervalRef.current);
            // Only call interactEnd if this specific showcase instance was running
            if (localShowcaseRunning) {
                handleInteractEnd(0); // Snap back immediately after showcase
                // setIsCardActive(false); // Reset local active state if needed
                setShowcaseRunning(false);
            }
          }, 4000); // Duration from Svelte
        } else {
            // If not visible when timeout triggers, clean up immediately
             setInteracting(false);
             // setIsCardActive(false);
             setShowcaseRunning(false);
             localShowcaseRunning = false;
        }
      }, 2000); // Start delay from Svelte
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      clearTimeout(showcaseTimerStartRef.current);
      clearTimeout(showcaseTimerEndRef.current);
      clearInterval(showcaseIntervalRef.current);
      // Ensure state is reset if unmounting during showcase
      if (localShowcaseRunning) {
        // handleInteractEnd(0); // May cause state update on unmounted component
        // Resetting internal state flags is safer
        setShowcaseRunning(false);
      }
    };
    // Add handleInteractEnd and isVisible to dependencies
  }, [showcase, isVisible, interactionApi, handleInteractEnd]);


  // --- Styles and Classes ---
  const cardClasses = [
    'card',
    types, // Add processed types as class
    'interactive', // Base class from Svelte
    isCardActive ? 'active' : '',
    interacting ? 'interacting' : '',
    loading ? 'loading' : '',
    mask ? 'masked' : '',
  ].filter(Boolean).join(' '); // Filter out empty strings and join


  const dynamicStyles = {
    // Static CSS vars (could also be set in CSS file)
    '--seedx': randomSeed.x,
    '--seedy': randomSeed.y,
    '--cosmosbg': `${cosmosPosition.x}px ${cosmosPosition.y}px`,

    // Animated CSS vars from interactionSpring
    '--pointer-x': interactionSpring.glareX.to(x => `${x}%`),
    '--pointer-y': interactionSpring.glareY.to(y => `${y}%`),
    // '--pointer-from-center': Needs interpolation if using separate springs or recalculate here
    '--pointer-from-center': interpolate([interactionSpring.glareX, interactionSpring.glareY], (x, y) =>
        clamp(Math.sqrt((y - 50) * (y - 50) + (x - 50) * (x - 50)) / 50, 0, 1)
    ),
    '--pointer-from-top': interactionSpring.glareY.to(y => y / 100),
    '--pointer-from-left': interactionSpring.glareX.to(x => x / 100),
    '--card-opacity': interactionSpring.glareO, // Assuming glareO controls this
    '--background-x': interactionSpring.bgX.to(x => `${x}%`),
    '--background-y': interactionSpring.bgY.to(y => `${y}%`),

    // Combined animated values for transform
    transform: interpolate(
      [
        popoverSpring.translateX,
        popoverSpring.translateY,
        popoverSpring.scale,
        interactionSpring.rotateX,
        interactionSpring.rotateY,
        popoverSpring.rotateDeltaX,
        popoverSpring.rotateDeltaY,
      ],
      (trX, trY, sc, rX, rY, rdX, rdY) =>
        `translateX(${trX}px) translateY(${trY}px) scale(${sc}) rotateX(${rX + rdX}deg) rotateY(${rY + rdY}deg)`
    ),
    // Apply foil styles directly if they exist
    ...foilStyles,
  };


  return (
    // Apply dynamic styles and ref to the outer animated div
    <animated.div
      ref={cardRef}
      className={cardClasses}
      style={dynamicStyles} // Apply the combined animated styles
      data-number={number}
      data-set={set}
      data-subtypes={subtypes}
      data-supertype={supertype}
      data-rarity={rarity}
      data-trainer-gallery={isTrainerGallery ? 'true' : undefined} // Use undefined for false boolean attributes
    >
      {/* The Svelte structure had translater/rotator - simplify if possible, but keeping structure for now */}
      {/* No need for separate translater/rotator divs if transform is on the main element */}
       <button
          className="card__rotator" // Keep class if CSS depends on it
          onClick={handleActivate}
          onPointerMove={handlePointerMove}
          onPointerLeave={handleMouseOut} // Use pointerLeave instead of mouseOut for better touch/pen behavior
          onBlur={handleDeactivate}
          aria-label={`Expand the Pokemon Card; ${name}.`}
          tabIndex={0}
          // Style perspective/transform-style might be needed on a parent or this button if not on root
          style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
          <img
            className="card__back"
            src={back}
            alt="The back of a Pokemon Card, a Pokeball in the center with Pokemon logo above and below"
            loading="lazy"
            width="660"
            height="921"
            style={{ backfaceVisibility: 'hidden' }} // Hide back when facing away
          />
          {/* Front Face Container */}
          <div
            className="card__front"
            // Static styles that don't change per interaction can go here or in CSS
            // style={staticStyles} // foilStyles are now part of dynamicStyles on parent
             style={{ backfaceVisibility: 'hidden' }} // Hide front when facing away
          >
            <img
              src={front_img}
              alt={`Front design of the ${name} Pokemon Card, with the stats and info around the edge`}
              onLoad={handleImageLoad}
              loading="lazy"
              width="660"
              height="921"
            />
            <div className="card__shine"></div>
            <div className="card__glare"></div>
          </div>
        </button>
    </animated.div>
  );
}

export default PokemonCard;

// --- CSS needed (PokemonCard.css or styled-components/etc) ---
/*
:root { ... } // Define initial CSS vars if needed, though React applies them dynamically

.card {
  position: relative;
  // display: inline-block; // Or block/flex item depending on layout
  transform-style: preserve-3d;
  perspective: 1000px; // Apply perspective here or on parent
  // Sizing - Use aspect ratio or fixed sizes based on your layout
  width: 240px; // Example size
  aspect-ratio: 660 / 921;
  cursor: pointer;
  transition: filter 0.3s; // For loading blur
}

.card.loading {
  filter: blur(10px);
}

.card__rotator {
  width: 100%;
  height: 100%;
  position: relative; // Needed for absolute positioning of children
  transform-style: preserve-3d;
  transition: transform 0.5s; // Base transition, react-spring overrides this
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  outline: none; // Style focus state appropriately
}
.card__rotator:focus-visible {
   box-shadow: 0 0 0 3px skyblue; // Example focus indicator
}


.card__back,
.card__front {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain; // Or cover/fill
  border-radius: 4.75% / 3.5%; // Match Pokemon card shape
  overflow: hidden;
  backface-visibility: hidden; // Crucial for flip effect
  pointer-events: none; // Images shouldn't intercept pointer events
}

.card__front {
  transform: rotateY(180deg); // Initially flipped if starting from back
  // Position front layers
  z-index: 2;
}
.card__back {
   z-index: 1;
}

// Flip effect (controlled by react-spring, but CSS sets up backface visibility)
// Example: If you wanted a CSS flip onClick (not needed with this JS)
// .card.active .card__rotator {
//   transform: rotateY(180deg);
// }


// --- Shine / Glare / Foil effects (Using CSS Variables) ---

.card__front img {
   display: block; // Remove extra space below image
   width: 100%;
   height: 100%;
}

.card__shine,
.card__glare {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit; // Inherit border radius
  mix-blend-mode: overlay; // Example blend mode
  pointer-events: none; // Don't interfere with interaction
  z-index: 3; // Above the image
}

.card__glare {
  background: radial-gradient(
    circle at var(--pointer-x) var(--pointer-y),
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0) 50%
  );
  opacity: var(--card-opacity); // Controlled by glareO spring
  mix-blend-mode: overlay; // Or screen, color-dodge etc.
}

.card__shine {
  // Example complex shine based on pointer position
  background: linear-gradient(
    calc( var(--rotate-y) * -1 - var(--rotate-x) * 1 )deg,
    rgba(255,255,255, calc(var(--pointer-from-center) * 0.5 ) ) 0%,
    rgba(255,255,255,0) 60%
  );
  opacity: var(--card-opacity); // Use same opacity or a different control
  mix-blend-mode: color-dodge; // Example
}

// Foil / Mask Effects
.card.masked .card__front::before,
.card.masked .card__front::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background-size: cover; // Or adjust as needed
  background-repeat: no-repeat;
  background-position: var(--background-x) var(--background-y);
  z-index: 1; // Below image/glare but above background
  pointer-events: none;
}

.card.masked .card__front::before { // Mask layer
  background-image: var(--mask);
  mix-blend-mode: multiply; // Adjust blend mode
  opacity: 0.8; // Adjust opacity
}

.card.masked .card__front::after { // Foil layer
  background-image: var(--foil);
  mix-blend-mode: color-dodge; // Adjust blend mode
  opacity: 1; // Adjust opacity
}

// Example cosmos effect (add class 'cosmos' if needed)
.card.rarity-cosmos-holo .card__front { // Target specific rarity if needed
   background-image: url(/path/to/cosmos-texture.jpg); // Or use CSS vars
   background-size: 150% 150%; // Example size
   background-position: var(--cosmosbg); // Use CSS var
   background-blend-mode: overlay; // Example
}

*/