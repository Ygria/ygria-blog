// PokemonCard.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSpring, animated, interpolate } from '@react-spring/web';
import { clamp, round, adjust } from '@/lib/math'; // Adjust path if needed
// import './PokemonCard.css'; // Import your CSS file here

// --- Type Definitions ---

// Define the expected structure for orientation data
interface OrientationData {
  relative?: {
    gamma: number;
    beta: number;
  } | null;
  // Add other potential orientation properties if needed
}

// Define the type for the active card identifier.
// Based on usage (activeCard === cardRef.current), it seems to be the ref object or null/undefined.
type ActiveCardElement = HTMLDivElement | null;
type ActiveCardIdentifier = ActiveCardElement | undefined;

// Define the component's props
interface PokemonCardProps {
  id: string; // Make ID required as it's likely essential
  name?: string;
  number?: string;
  set?: string;
  types?: string | string[];
  subtypes?: string | string[];
  supertype?: string;
  rarity?: string;
  img?: string;
  back?: string;
  foil?: string;
  mask?: string;
  showcase?: boolean;
  // --- Props assumed from parent context/state ---
  activeCard: ActiveCardIdentifier;
  setActiveCard: (cardRef: ActiveCardIdentifier) => void; // Expects the ref or undefined
  orientation: OrientationData | null | undefined;
  resetBaseOrientation: () => void;
}

// --- React Spring Config ---
const springInteractSettings = { tension: 250, friction: 30 };
const springPopoverSettings = { tension: 180, friction: 40 };
const springSnapSettings = { tension: 350, friction: 15 };

// --- Global Declarations (if gtag is globally available) ---
declare global {
  interface Window {
    gtag?: (type: string, eventName: string, eventParams: Record<string, any>) => void;
  }
}

// --- Component Implementation ---
function PokemonCard({
  id, // required from props
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
  activeCard, // required from props
  setActiveCard, // required from props
  orientation, // required from props
  resetBaseOrientation, // required from props
}: PokemonCardProps) {

  const cardRef = useRef<HTMLDivElement>(null);
  const repositionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showcaseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showcaseTimerStartRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showcaseTimerEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);

  const [interacting, setInteracting] = useState(false);
  const [isCardActive, setIsCardActive] = useState(false);
  const [firstPop, setFirstPop] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [showcaseRunning, setShowcaseRunning] = useState(showcase);
  const [foilStyles, setFoilStyles] = useState<React.CSSProperties>({}); // Explicitly type state

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
  }, [img]);

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
  const updateSprings = useCallback((
    background: { x: number; y: number },
    rotate: { x: number; y: number }, // Corrected type
    glare: { x: number; y: number; o: number }, // Added type
    config = springInteractSettings
  ) => {
    interactionApi.start({
      bgX: background.x, bgY: background.y,
      rotateX: rotate.x, rotateY: rotate.y,
      glareX: glare.x, glareY: glare.y, glareO: glare.o,
      config: config,
    });
  }, [interactionApi]);

  const handleInteractEnd = useCallback((delay = 500) => {
    // No need to store timeout ID in a ref unless cleared elsewhere, but return is fine
    const timeoutId = setTimeout(() => {
      setInteracting(false);
      interactionApi.start({
        rotateX: 0, rotateY: 0,
        glareX: 50, glareY: 50, glareO: 0,
        bgX: 50, bgY: 50,
        config: springSnapSettings,
      });
    }, delay);
    return timeoutId; // Optional return
  }, [interactionApi]);

  const endShowcase = useCallback(() => {
    if (showcaseRunning) {
       // Clear refs safely
       if (showcaseTimerEndRef.current) clearTimeout(showcaseTimerEndRef.current);
       if (showcaseTimerStartRef.current) clearTimeout(showcaseTimerStartRef.current);
       if (showcaseIntervalRef.current) clearInterval(showcaseIntervalRef.current);
       showcaseTimerEndRef.current = null;
       showcaseTimerStartRef.current = null;
       showcaseIntervalRef.current = null;

      setShowcaseRunning(false);
      handleInteractEnd(0); // Snap back immediately
    }
  }, [showcaseRunning, handleInteractEnd]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    endShowcase();
    // Check if interaction should happen
    if (!isVisible || !cardRef.current || (activeCard && activeCard !== cardRef.current)) {
        // Optional: Reset interaction state if moving pointer off while inactive
        // if (interacting) setInteracting(false);
        return;
    }

    setInteracting(true);
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clientX = e.clientX; // Use direct clientX/Y from PointerEvent
    const clientY = e.clientY;

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
  }, [isVisible, activeCard, updateSprings, endShowcase, /* interacting - add if used */ ]); // Added interacting based on potential logic flow

  const handlePointerLeave = useCallback(() => { // Renamed from handleMouseOut
    if (interacting) {
      handleInteractEnd();
    }
  }, [interacting, handleInteractEnd]);

  const handleActivate = useCallback(() => {
    if (activeCard && activeCard === cardRef.current) {
      setActiveCard(undefined); // Deactivate
    } else {
      setActiveCard(cardRef.current); // Activate this card
      resetBaseOrientation();
      // Use optional chaining and check window object for safety
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag("event", "select_item", {
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
    if (isCardActive) { // Check if *this* card was the one losing focus
      handleInteractEnd(100); // Quick snap back
      // Optional: Deactivate on blur if desired setActiveCard(undefined);
    }
  }, [isCardActive, handleInteractEnd /*, setActiveCard */]); // setActiveCard needed if uncommented

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
    });
  }, [popoverApi]);

  const popover = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    let animationDelay = 100; // Default delay after interaction end
    const scaleW = (window.innerWidth / rect.width) * 0.9;
    const scaleH = (window.innerHeight / rect.height) * 0.9;
    const scaleF = 1.75; // Max scale factor
    const targetScale = Math.min(scaleW, scaleH, scaleF);

    setCenter();

    if (firstPop) {
      animationDelay = 1000; // Longer wait after interaction end for initial flip
      popoverApi.start({
        rotateDeltaX: 360,
        rotateDeltaY: 0, // Or any initial rotation effect
        scale: targetScale,
        config: springPopoverSettings,
        delay: 100 // Delay before popover animation itself starts
      });
      setFirstPop(false);
    } else {
      popoverApi.start({
        scale: targetScale,
        // rotateDeltaX/Y retain their values unless explicitly reset
        config: springPopoverSettings,
      });
    }

    handleInteractEnd(animationDelay); // End tilt interaction after specified delay
  }, [setCenter, firstPop, popoverApi, handleInteractEnd]);

  const retreat = useCallback(() => {
    popoverApi.start({
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotateDeltaX: 0,
      rotateDeltaY: 0,
      config: { ...springPopoverSettings, tension: 220 }, // Slightly faster retreat
    });
    handleInteractEnd(100); // End tilt interaction quickly
  }, [popoverApi, handleInteractEnd]);

  const reset = useCallback(() => {
    handleInteractEnd(0); // End interaction immediately
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
    setFirstPop(true); // Reset first pop flag if needed on full reset
  }, [handleInteractEnd, popoverApi, interactionApi]);

  // --- Effects ---

  // Handle activeCard changes (popover/retreat)
  useEffect(() => {
    // Determine if this specific card instance is the active one
    const thisCardIsCurrentlyActive = activeCard === cardRef.current;

    // Update local state reflecting activation status
    // This check prevents calling retreat on initial render or if another card becomes active
    const wasPreviouslyActive = isCardActive;
    setIsCardActive(thisCardIsCurrentlyActive);

    if (thisCardIsCurrentlyActive) {
        popover();
    } else if (wasPreviouslyActive && !thisCardIsCurrentlyActive) {
        // Only retreat if this card *was* active and now isn't
        retreat();
    }
    // Dependencies:
    // - activeCard: Triggers the check.
    // - popover, retreat: Stable callbacks, needed as they are called.
    // - isCardActive: Include because the logic depends on the *previous* value (wasPreviouslyActive).
  }, [activeCard, popover, retreat, isCardActive]);

  // Define type for relative orientation data used by handler
  interface RelativeOrientation { gamma: number; beta: number; }

  // Handle orientation changes for active card
  const handleOrientation = useCallback((relativeOrientation: RelativeOrientation | null | undefined) => {
      if (!relativeOrientation) return;
      // Device orientation axes might vary; gamma often corresponds to Y-axis rotation, beta to X-axis
      const x = relativeOrientation.gamma; // Map gamma to card's X rotation (tilt side-to-side)
      const y = relativeOrientation.beta;  // Map beta to card's Y rotation (tilt forward/back)
      const limit = { x: 16, y: 18 }; // Rotation limits

      const degrees = {
          x: clamp(x, -limit.x, limit.x),
          y: clamp(y, -limit.y, limit.y)
      };

      // Update springs based on orientation degrees
      // Note: Don't set `interacting` to true for passive orientation changes
      updateSprings({
          // Adjust background position based on tilt
          x: adjust(degrees.x, -limit.x, limit.x, 37, 63), // Map X tilt to background X
          y: adjust(degrees.y, -limit.y, limit.y, 33, 67), // Map Y tilt to background Y
      }, {
          // Adjust card rotation (may need inversion depending on desired effect)
          x: round(degrees.y * -1), // Map Y tilt (beta) to rotateX
          y: round(degrees.x),    // Map X tilt (gamma) to rotateY
      }, {
          // Adjust glare position based on tilt
          x: adjust(degrees.x, -limit.x, limit.x, 0, 100), // Map X tilt to glare X
          y: adjust(degrees.y, -limit.y, limit.y, 0, 100), // Map Y tilt to glare Y
          o: 1, // Keep glare fully visible during orientation tilt
      });
  }, [updateSprings]); // Depends only on the stable updateSprings callback

  // Effect to apply orientation changes when active
  useEffect(() => {
      if (isCardActive && orientation?.relative) {
          handleOrientation(orientation.relative);
      }
      // Dependencies:
      // - isCardActive: Only run when this card is active.
      // - orientation: Run when orientation data changes.
      // - handleOrientation: Stable callback, include because it's called.
  }, [isCardActive, orientation, handleOrientation]);

  // Visibility change listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      if (!visible) {
        endShowcase(); // Stop showcase if running
        reset(); // Reset card state completely when tab hidden
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Set initial state correctly
    setIsVisible(document.visibilityState === 'visible');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Cleanup potentially running showcase on unmount/effect re-run
      endShowcase();
    };
  }, [reset, endShowcase]); // Need reset and endShowcase callbacks

  // Reposition on scroll/resize listener
  const handleReposition = useCallback(() => {
    if (repositionTimerRef.current) {
      clearTimeout(repositionTimerRef.current);
    }
    repositionTimerRef.current = setTimeout(() => {
      // Check isCardActive *inside* the timeout to use the latest value
      if (isCardActive) {
        setCenter();
      }
    }, 200); // Slightly shorter delay might feel more responsive
  }, [isCardActive, setCenter]); // Need isCardActive and setCenter

  useEffect(() => {
    window.addEventListener('scroll', handleReposition, { passive: true }); // Use passive listener
    window.addEventListener('resize', handleReposition); // Also reposition on resize

    return () => {
      window.removeEventListener('scroll', handleReposition);
      window.removeEventListener('resize', handleReposition);
      if (repositionTimerRef.current) {
        clearTimeout(repositionTimerRef.current);
      }
    };
  }, [handleReposition]); // Effect depends on the callback

  // Image loading handler
 // Image loading handler
 const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  setLoading(false);
  console.log(event)
  // Apply foil styles only if mask or foil URLs are provided
  if (mask || foil) {
    setFoilStyles({
      '--mask': mask ? `url(${mask})` : 'none', // Keep the logic
      '--foil': foil ? `url(${foil})` : 'none', // Keep the logic
    } as React.CSSProperties); // <--- 添加类型断言
  }
}, [mask, foil]); // Dependencies remain the same

  // Showcase animation effect
  useEffect(() => {
    isMountedRef.current = true;
    let localShowcaseRunning = false; // Track running state within this effect instance

    if (showcase && isVisible) {
      const showcaseConfig = { tension: 100, friction: 50 };
      let rotationAngle = 0;

      // Start showcase after a delay
      showcaseTimerStartRef.current = setTimeout(() => {
        if (!isMountedRef.current || document.visibilityState !== 'visible') {
           setShowcaseRunning(false); // Ensure state is false if not visible
           return;
        }
        setInteracting(true); // Mark as interacting for visual effects
        localShowcaseRunning = true;
        setShowcaseRunning(true); // Update state

        // Begin animation interval
        showcaseIntervalRef.current = setInterval(() => {
          if (!isMountedRef.current) { // Check mount status inside interval
              clearInterval(showcaseIntervalRef.current!); // Use non-null assertion or check
              return;
          }
          rotationAngle += 0.05;
          interactionApi.start({
            rotateX: Math.sin(rotationAngle) * 15,
            rotateY: Math.cos(rotationAngle) * 15,
            glareX: 55 + Math.sin(rotationAngle) * 45,
            glareY: 55 + Math.cos(rotationAngle) * 45,
            glareO: 0.8,
            bgX: 30 + Math.sin(rotationAngle) * 20,
            bgY: 30 + Math.cos(rotationAngle) * 20,
            config: showcaseConfig,
          });
        }, 20); // Animation interval

        // Schedule end of showcase
        showcaseTimerEndRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          if (showcaseIntervalRef.current) clearInterval(showcaseIntervalRef.current);
          showcaseIntervalRef.current = null;

          // Only reset interaction if this specific showcase instance was running
          if (localShowcaseRunning) {
            handleInteractEnd(0); // Snap back immediately
            setShowcaseRunning(false); // Update state
          }
        }, 4000); // Showcase duration

      }, 2000); // Delay before showcase starts
    } else {
       // Ensure showcase state is false if props change or component becomes invisible
       setShowcaseRunning(false);
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      // Clear all timers and intervals related to showcase
      if (showcaseTimerStartRef.current) clearTimeout(showcaseTimerStartRef.current);
      if (showcaseTimerEndRef.current) clearTimeout(showcaseTimerEndRef.current);
      if (showcaseIntervalRef.current) clearInterval(showcaseIntervalRef.current);
       showcaseTimerStartRef.current = null;
       showcaseTimerEndRef.current = null;
       showcaseIntervalRef.current = null;


      // Reset interaction state if unmounting *during* a showcase run
      if (localShowcaseRunning) {
        // Resetting state directly might be safer than calling handleInteractEnd which updates springs
         setInteracting(false);
         setShowcaseRunning(false);
         // Potentially force reset springs if needed, but handleInteractEnd(0) might be okay if guarded
         // interactionApi.start({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, glareO: 0, bgX: 50, bgY: 50, immediate: true });
      }
    };
  }, [showcase, isVisible, interactionApi, handleInteractEnd]); // Dependencies


  // --- Styles and Classes ---
  const cardClasses = useMemo(() => [
    'card',
    types, // Add processed types as class
    'interactive',
    isCardActive ? 'active' : '',
    interacting ? 'interacting' : '',
    loading ? 'loading' : '',
    mask || foil ? 'masked' : '', // Add masked if foil or mask is present
    `rarity-${rarity.replace(/\s+/g, '-').toLowerCase()}`, // e.g., rarity-rare-holo
    `supertype-${supertype.toLowerCase()}`, // e.g., supertype-pokémon
  ].filter(Boolean).join(' '), [types, isCardActive, interacting, loading, mask, foil, rarity, supertype]);


  const dynamicStyles = useMemo<React.CSSProperties>(() => ({
    // Static CSS vars (could also be set in CSS file if not dynamic per card)
    '--seedx': randomSeed.x,
    '--seedy': randomSeed.y,
    '--cosmosbg': `${cosmosPosition.x}px ${cosmosPosition.y}px`,

    // Animated CSS vars from interactionSpring
    '--pointer-x': interactionSpring.glareX.to(x => `${x}%`),
    '--pointer-y': interactionSpring.glareY.to(y => `${y}%`),
    '--pointer-from-center': interpolate([interactionSpring.glareX, interactionSpring.glareY], (x, y) =>
        clamp(Math.sqrt(Math.pow(y - 50, 2) + Math.pow(x - 50, 2)) / 50, 0, 1) // Use Math.pow for clarity
    ),
    '--pointer-from-top': interactionSpring.glareY.to(y => (y / 100)),
    '--pointer-from-left': interactionSpring.glareX.to(x => (x / 100)),
    '--card-opacity': interactionSpring.glareO, // Controls glare layer opacity
    '--background-x': interactionSpring.bgX.to(x => `${x}%`), // For foil/mask movement
    '--background-y': interactionSpring.bgY.to(y => `${y}%`),
    // Add rotation values as CSS vars if needed by CSS shine effects
    '--rotate-x': interactionSpring.rotateX.to(rx => `${rx}deg`),
    '--rotate-y': interactionSpring.rotateY.to(ry => `${ry}deg`),


    // Combined animated values for transform property
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
    // Apply foil styles (CSS Variables for mask/foil URLs) directly
    ...foilStyles,
    // Add perspective here if it's not on a static parent
    perspective: '1000px',

  } as React.CSSProperties), [interactionSpring, popoverSpring, foilStyles, randomSeed, cosmosPosition]); // Include all dependencies for styles

// Temporary test ONLY
const AnyAnimatedDiv = animated.div as any;
  return (
    <AnyAnimatedDiv
      ref={cardRef}
      className={cardClasses}
      style={dynamicStyles} // Apply combined animated and static styles
      data-id={id}
      data-number={number}
      data-set={set}
      data-subtypes={subtypes}
      data-supertype={supertype}
      data-rarity={rarity}
      data-trainer-gallery={isTrainerGallery || undefined} // Use boolean directly or undefined
    >
      {/* Button provides interaction and accessibility */}
       <button
         className="card__rotator"
         onClick={handleActivate}
         onPointerMove={handlePointerMove}
         onPointerLeave={handlePointerLeave} // Use pointerLeave
         onBlur={handleDeactivate} // Handle focus loss
         aria-label={`Pokemon Card: ${name}. Number ${initialNumber}. Rarity ${initialRarity}. Click to expand.`} // More descriptive label
         tabIndex={0} // Make focusable
         style={{
           // Ensure 3D transforms work correctly
           transformStyle: 'preserve-3d',
           // Perspective could be here or on the parent animated.div
           // perspective: '1000px', // Included in dynamicStyles now
           width: '100%', // Ensure button fills the container
           height: '100%',
           border: 'none', // Reset button styles
           background: 'transparent',
           padding: 0,
           cursor: 'pointer',
           outline: 'none', // Default outline removed, ensure :focus-visible styles are present in CSS
           WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
         }}
       >
         <img
           className="card__back"
           src={back}
           alt="Pokemon Card back" // Simplified alt text
           loading="lazy"
           width="660" // Provide intrinsic size for layout stability
           height="921"
           style={{ backfaceVisibility: 'hidden' }} // Hide when facing away
         />
         {/* Front Face Container */}
         <div
           className="card__front"
           style={{ backfaceVisibility: 'hidden' }} // Hide when facing away
         >
           <img
             className="card__image" // Specific class for the main image
             src={front_img}
             alt={`Pokemon Card front: ${name}`} // Simplified alt text
             onLoad={handleImageLoad}
             loading="lazy"
             width="660"
             height="921"
           />
           {/* Shine and Glare elements are positioned over the image via CSS */}
           <div className="card__shine"></div>
           <div className="card__glare"></div>
           {/* Foil/Mask effects are applied via ::before/::after in CSS */}
         </div>
       </button>
    </AnyAnimatedDiv>
  );
}

export default PokemonCard;

// --- Associated CSS (`PokemonCard.css` or styled equivalent) ---
/*
:root {
  // Define base variables if needed
}

.card {
  position: relative;
  display: inline-block; // Or block/flex item depending on layout
  width: 240px; // Example size
  aspect-ratio: 660 / 921; // Maintain aspect ratio
  cursor: pointer;
  // Apply perspective here if not on the element itself via style prop
  // perspective: 1000px;
  transform-style: preserve-3d; // Children will exist in 3D space
  transition: filter 0.3s ease-out; // Transition for loading blur
  contain: layout style paint; // Performance optimization
  -webkit-tap-highlight-color: transparent; // Remove tap highlight on mobile iOS
}

.card.loading {
  filter: blur(10px) saturate(0.5); // Blur effect while loading
}

.card__rotator {
  // Inherit size, position relatively for children
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d; // Enable 3D for children (front/back)
  // DO NOT apply transition: transform here, it conflicts with react-spring
  border: none; // Reset button defaults
  background: none;
  padding: 0;
  cursor: pointer;
  outline: none; // Remove default outline
  border-radius: inherit; // Inherit border radius from parent .card if any
}

// Apply focus styles using :focus-visible for accessibility
.card__rotator:focus-visible {
  box-shadow: 0 0 0 3px deepskyblue; // Example focus indicator
  border-radius: inherit; // Match card rounding
}

.card__back,
.card__front {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; // Clip contents to card shape
  backface-visibility: hidden; // Crucial for the flip effect
  pointer-events: none; // Prevent layers from interfering with button events
  // Standard Pokemon card border radius
  border-radius: 4.75% / 3.5%;
  transform-style: preserve-3d; // Allow 3d positioning of children if needed
}

.card__front {
  // Front initially faces away if using a flip effect (rotateY 180deg).
  // However, the JS controls the rotation, so no initial transform needed here
  // unless you specifically want it to start flipped.
  // transform: rotateY(180deg);
  z-index: 2; // Front is visually on top
}
.card__back {
   z-index: 1; // Back is visually behind
}

// --- Image Styling ---
.card__front .card__image { // Target the image specifically
  display: block; // Remove potential extra space below img
  width: 100%;
  height: 100%;
  object-fit: contain; // Or 'cover' depending on desired look
  border-radius: inherit; // Ensure image fits the rounded corners
  position: relative; // Needed if shine/glare are absolutely positioned relative to it
  z-index: 1; // Base layer within the front face
}

// --- Shine / Glare / Foil Effects (Using CSS Variables) ---

.card__shine,
.card__glare {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  pointer-events: none;
  z-index: 3; // Above the main image but below potential text overlays
}

.card__glare {
  background: radial-gradient(
    circle at var(--pointer-x) var(--pointer-y),
    hsla(0, 0%, 100%, 0.8) 0%,
    hsla(0, 0%, 100%, 0) 50% // Use HSL/RGBA for better control
  );
  opacity: var(--card-opacity); // Controlled by glareO spring
  mix-blend-mode: overlay; // Good starting point for glare
  transition: opacity 0.2s; // Smooth fade out for glare
}

.card__shine {
  // Example complex shine based on pointer and rotation (adjust as needed)
  background: linear-gradient(
    calc( (var(--rotate-y, 0deg)) * -1 + (var(--rotate-x, 0deg)) * 1), // Calculate angle based on rotation CSS vars
    hsla(0, 0%, 100%, calc(var(--pointer-from-center, 0) * 0.5)) 0%, // Use pointer distance for intensity
    hsla(0, 0%, 100%, 0) 60%
  );
  opacity: var(--card-opacity); // Often tied to glare opacity
  mix-blend-mode: color-dodge; // Good starting point for shine
  transition: opacity 0.2s; // Smooth fade out
}


// --- Foil / Mask Effects ---

// Use pseudo-elements on the .card__front container
.card.masked .card__front::before, // Mask layer
.card.masked .card__front::after { // Foil layer
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background-size: cover; // Default size
  background-repeat: no-repeat;
  // Use CSS variables set by JS for dynamic positioning
  background-position: var(--background-x, 50%) var(--background-y, 50%);
  pointer-events: none;
  z-index: 2; // Position between image (z-index 1) and glare/shine (z-index 3)
}

.card.masked .card__front::before { // Mask Layer (e.g., texture, pattern)
  background-image: var(--mask); // Set via inline style (foilStyles state)
  mix-blend-mode: multiply; // Example blend mode
  opacity: 0.7; // Adjust opacity as needed
}

.card.masked .card__front::after { // Foil Layer (e.g., holo effect)
  background-image: var(--foil); // Set via inline style (foilStyles state)
  mix-blend-mode: color-dodge; // Example blend mode for holo
  opacity: 1; // Adjust opacity as needed
}

// --- Specific Rarity Effects (Example) ---
// Example for a 'Cosmos Holo' rarity class
.card.rarity-cosmos-holo .card__front::after { // Target the foil layer
  background-image: var(--foil), url('/images/cosmos-texture.webp'); // Combine dynamic foil with static cosmos
  background-size: cover, 150% 150%; // Size for each background
  background-position: var(--background-x) var(--background-y), var(--cosmosbg); // Position each background
  background-blend-mode: color-dodge, overlay; // Blend modes for each layer
  mix-blend-mode: normal; // Reset base mix-blend-mode if using multiple backgrounds
  opacity: 1;
}

*/