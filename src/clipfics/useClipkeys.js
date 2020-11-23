import React, { useState, useContext, useRef, useEffect } from 'react';
import { ThemeContext } from 'theme.js';
// import { useClipficsContext } from 'tasks.js';
import useTextFieldModal from 'common/useTextFieldModal.js';
import { useSelectionCache } from 'common/useContainerSelection.js';
import useModal from 'common/useModal.js';
import useForEachLoop from 'common/useForEachLoop.js';
import useInitializer from 'common/useInitializer.js';
import CookieSynthLabel, {
  TemplateDescription,
} from './cookiesynth/CookieSynthLabel.js';
import { isLabelValid } from './cookiesynth/common.js';
import RangeUtils from 'common/RangeUtils.js';
import { Button, Link } from '@material-ui/core';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import useForceUpdateControl from 'common/useForceUpdateControl.js';
import useFixedOptionsWindow, { FixedOptions } from 'common/useFixedOptionsWindow.js';
import useTextFieldWindow from 'common/useTextFieldWindow.js';
import useAutocompleteWindow, {
  AutocompleteOptions,
} from 'common/useAutocompleteWindow.js';
import useSelectionModal from 'common/useSelectionModal.js';
import { TextField } from '@material-ui/core';

const PROP_HINTS = new Map();
PROP_HINTS.set('character', 'e.g., Twilight Sparkle');
PROP_HINTS.set('age', 'baby, foal, teen, adult, elder');
PROP_HINTS.set('gender', 'male, female');
PROP_HINTS.set('emotion', 'e.g., excited');
PROP_HINTS.set('rate', 'fast, medium, slow');
PROP_HINTS.set('stress', 'none, strong, moderate, reduced');
PROP_HINTS.set('volume', 'whisper, soft, medium, loud, x-loud');
PROP_HINTS.set('pitch', 'low, high');
PROP_HINTS.set('pause-before', 'none, weak, medium, strong');
PROP_HINTS.set('pause-after', 'none, weak, medium, strong');
PROP_HINTS.set('balance', 'left, center, right, left-to-center, left-to-right, etc.');
PROP_HINTS.set('effects', 'subvocalized, memory, royal canterlot voice, muted');
PROP_HINTS.set('pronunciation', 'e.g., Dear Princess {S AH0 L EH1 S T IY0 AH2}');

/*
  active hotkey -> label specification
  label specification {
    template
  }

  parameter setter:
    template -> parameters -> dialog sequence
  
  description getter:
    template -> description  
*/

class AllowedValues {
  knownOptions = new Map();

  constructor() {
    this.knownOptions.set(
      'character',
      new AutocompleteOptions()
        .addOption('Adagio Dazzle')
        .addOption('Ahuizotl')
        .addOption('AK Yearling')
        .addOption('All Aboard')
        .addOption('Apple Bloom')
        .addOption('Apple Cobbler')
        .addOption('Applejack')
        .addOption('Apple Rose')
        .addOption('Aria Blaze')
        .addOption('Arizona')
        .addOption('Aunt Holiday')
        .addOption('Auntie Applesauce')
        .addOption('Auntie Lofty')
        .addOption('Autumn Blaze')
        .addOption('Babs Seed')
        .addOption('Big Bucks')
        .addOption('Big Daddy Mccolt')
        .addOption('Big Macintosh')
        .addOption('Biscuit')
        .addOption('Blaze')
        .addOption('Bow Hothoof')
        .addOption('Boyle')
        .addOption('Braeburn')
        .addOption('Bright Mac')
        .addOption('Bulk Biceps')
        .addOption('Burnt Oak')
        .addOption('Caballeron')
        .addOption('Cadance')
        .addOption('Canter Zoom')
        .addOption('Capper')
        .addOption('Captain Celaeno')
        .addOption('Carnival Barker')
        .addOption('Celestia')
        .addOption('Cheerilee')
        .addOption('Cheese Sandwich')
        .addOption('Cherry Berry')
        .addOption('Cherry Jubilee')
        .addOption('Chestnut Magnifico')
        .addOption('Chiffon Swirl')
        .addOption('Chrysalis')
        .addOption('Cinch')
        .addOption('Clear Skies')
        .addOption('Clear Sky')
        .addOption('Cloudy Quartz')
        .addOption('Coco Pommel')
        .addOption('Code Red')
        .addOption('Coriander Cumin')
        .addOption('Countess Coloratura')
        .addOption('Cozy Glow')
        .addOption('Cranberry Muffin')
        .addOption('Cranky')
        .addOption('Daisy')
        .addOption('Daybreaker')
        .addOption('Derpy')
        .addOption('Diamond Tiara')
        .addOption('Discord')
        .addOption('Donut Joe')
        .addOption('Double Diamond')
        .addOption('Dragon Lord Torch')
        .addOption('Dr Fauna')
        .addOption('Dr Hooves')
        .addOption('Ember')
        .addOption('Fancy Pants')
        .addOption('Featherweight')
        .addOption('Female Pony 2')
        .addOption('Filthy Rich')
        .addOption('Firelight')
        .addOption('Flam')
        .addOption('Flash Magnus')
        .addOption('Flash Sentry')
        .addOption('Fleetfoot')
        .addOption('Flim')
        .addOption('Flurry Heart')
        .addOption('Fluttershy')
        .addOption('Fred')
        .addOption('Gabby')
        .addOption('Gallus')
        .addOption('Garble')
        .addOption('Gilda')
        .addOption('Gladmane')
        .addOption('Gloriosa Daisy')
        .addOption('Goldgrape')
        .addOption('Goldie Delicious')
        .addOption('Grampa Gruff')
        .addOption('Grand Pear')
        .addOption('Granny Smith')
        .addOption('Grogar')
        .addOption('Grubber')
        .addOption('Gustave Le Grand')
        .addOption('High Winds')
        .addOption('Hoity Toity')
        .addOption('Hoofar')
        .addOption('Horsey')
        .addOption('Igneous')
        .addOption('Iron Will')
        .addOption('Jack Pot')
        .addOption('Juniper Montage')
        .addOption('Lemon Hearts')
        .addOption('Lemon Zest')
        .addOption('Lighthoof')
        .addOption('Lightning Dust')
        .addOption('Lily Valley')
        .addOption('Limestone')
        .addOption('Lix Spittle')
        .addOption('Louise')
        .addOption('Luggage Cart')
        .addOption('Luna')
        .addOption('Luster Dawn')
        .addOption('Lyra Heartstrings')
        .addOption('Ma Hooffield')
        .addOption('Mane Allgood')
        .addOption('Mane-iac')
        .addOption('Marble')
        .addOption('Matilda')
        .addOption('Maud')
        .addOption('Mayor Mare')
        .addOption('Meadowbrook')
        .addOption('Micro Chips')
        .addOption('Midnight Sparkle')
        .addOption('Minuette')
        .addOption('Miss Harshwhinny')
        .addOption('Mistmane')
        .addOption('Misty Fly')
        .addOption('Moon Dancer')
        .addOption('Mori')
        .addOption('Mr Cake')
        .addOption('Mrs Cake')
        .addOption('Mr Shy')
        .addOption('Mrs Shy')
        .addOption('Mudbriar')
        .addOption('Mulia Mild')
        .addOption('Mullet')
        .addOption('Multiple')
        .addOption('Neighsay')
        .addOption('Night Glider')
        .addOption('Night Light')
        .addOption('Nightmare Moon')
        .addOption('Nurse Redheart')
        .addOption('Ocean Flow')
        .addOption('Ocellus')
        .addOption('Octavia')
        .addOption('Oleander')
        .addOption('On Stage')
        .addOption('Party Favor')
        .addOption('Pear Butter')
        .addOption('Pharynx')
        .addOption('Photo Finish')
        .addOption('Photographer')
        .addOption('Pig Creature 1')
        .addOption('Pig Creature 2')
        .addOption('Pinkie Pie')
        .addOption('Pipsqueak')
        .addOption('Pom')
        .addOption('Pony Of Shadows')
        .addOption('Prince Rutherford')
        .addOption('Pursey Pink')
        .addOption('Pushkin')
        .addOption('Queen Novo')
        .addOption('Quibble Pants')
        .addOption('Rachel Platten')
        .addOption('Rainbow Dash')
        .addOption('Rain Shine')
        .addOption('Rarity')
        .addOption('Raspberry Beret')
        .addOption('Rockhoof')
        .addOption('Rolling Thunder')
        .addOption('Rose')
        .addOption('Rumble')
        .addOption('s4e26 Unnamed Earth Mare #1')
        .addOption('Saffron Masala')
        .addOption('Sandalwood')
        .addOption('Sandbar')
        .addOption('Sans Smirk')
        .addOption('Sapphire Shores')
        .addOption('Sassy Saddles')
        .addOption('Scootaloo')
        .addOption('Seaspray')
        .addOption('Shimmy Shake')
        .addOption('Shining Armor')
        .addOption('Short Fuse')
        .addOption('Silver Spoon')
        .addOption('Silverstream')
        .addOption('Skeedaddle')
        .addOption('Sky Beak')
        .addOption('Skystar')
        .addOption('Sky Stinger')
        .addOption('Sludge')
        .addOption('Smolder')
        .addOption('Snails')
        .addOption('Snap Shutter')
        .addOption('Snips')
        .addOption('Soarin')
        .addOption('Sombra')
        .addOption('Somnambula')
        .addOption('Sonata Dusk')
        .addOption('Songbird Serenade')
        .addOption('Sour Sweet')
        .addOption('Spike')
        .addOption('Spitfire')
        .addOption('Spoiled Rich')
        .addOption('Spur')
        .addOption('Starlight')
        .addOption('Star Swirl')
        .addOption('Stellar Flare')
        .addOption('Steve')
        .addOption('Storm Creature')
        .addOption('Stormy Flare')
        .addOption('Stygian')
        .addOption('Sugar Belle')
        .addOption('Sugarcoat')
        .addOption('Sunburst')
        .addOption('Sunny Flare')
        .addOption('Sunset Shimmer')
        .addOption('Surprise')
        .addOption('Svengallop')
        .addOption('Sweetie Belle')
        .addOption('Sweetie Drops')
        .addOption('Tempest Shadow')
        .addOption('Terramar')
        .addOption('The Storm King')
        .addOption('Thorax')
        .addOption('Thunderlane')
        .addOption('Tianhuo')
        .addOption('Tight End')
        .addOption('Timber Spruce')
        .addOption('Tirek')
        .addOption('Toothy Klugetowner')
        .addOption('Tourist Pony')
        .addOption('Tree Hugger')
        .addOption('Tree Of Harmony')
        .addOption('Trixie')
        .addOption('Trouble Shoes')
        .addOption('Twilight Sparkle')
        .addOption('Twilight Velvet')
        .addOption('Twinkleshine')
        .addOption('Twist')
        .addOption('Vapor Trail')
        .addOption('Velvet')
        .addOption('Vendor 2')
        .addOption('Vera')
        .addOption('Verko')
        .addOption('Vignette')
        .addOption('Vinny')
        .addOption('Wallflower')
        .addOption('Whinnyfield')
        .addOption('Wind Rider')
        .addOption('Wind Sprint')
        .addOption('Windy Whistles')
        .addOption('Yona')
        .addOption('Young Granny Smith')
        .addOption('Zecora')
        .addOption('Zephyr')
        .addOption('Zesty Gourmand')
        .addOption('Mean Applejack')
        .addOption('Mean Fluttershy')
        .addOption('Mean Pinkie Pie')
        .addOption('Mean Rainbow Dash')
        .addOption('Mean Rarity')
        .addOption('Mean Twilight Sparkle'),
    );

    this.knownOptions.set(
      'emotion',
      new AutocompleteOptions()
        .addOption('Neutral')
        .addOption('Anxious')
        .addOption('Happy')
        .addOption('Annoyed')
        .addOption('Sad')
        .addOption('Confused')
        .addOption('Smug')
        .addOption('Angry')
        .addOption('Whispering')
        .addOption('Shouting')
        .addOption('Sarcastic')
        .addOption('Amused')
        .addOption('Surprised')
        .addOption('Singing')
        .addOption('Fear')
        .addOption('Serious'),
    );

    this.knownOptions.set(
      'age',
      new FixedOptions()
        .addOption('1', 'Baby')
        .addOption('2', 'Foal')
        .addOption('3', 'Teen')
        .addOption('4', 'Adult')
        .addOption('5', 'Elder'),
    );

    this.knownOptions.set(
      'gender',
      new FixedOptions().addOption('1', 'Male').addOption('2', 'Female'),
    );

    this.knownOptions.set(
      'rate',
      new FixedOptions()
        .addOption('1', 'Default')
        .addOption('2', 'Slow')
        .addOption('3', 'Medium')
        .addOption('4', 'Fast'),
    );

    this.knownOptions.set(
      'stress',
      new FixedOptions()
        .addOption('1', 'Default')
        .addOption('2', 'None')
        .addOption('3', 'Reduced')
        .addOption('4', 'Moderate')
        .addOption('5', 'Strong'),
    );

    this.knownOptions.set(
      'volume',
      new FixedOptions()
        .addOption('1', 'Default')
        .addOption('2', 'Whisper')
        .addOption('3', 'Soft')
        .addOption('4', 'Medium')
        .addOption('5', 'Loud')
        .addOption('6', 'X-loud'),
    );

    this.knownOptions.set(
      'pitch',
      new FixedOptions()
        .addOption('1', 'Default')
        .addOption('2', 'Low')
        .addOption('3', 'Medium')
        .addOption('4', 'High'),
    );

    this.knownOptions.set(
      'pause-before',
      new FixedOptions()
        .addOption('1', 'Default')
        .addOption('2', 'None')
        .addOption('3', 'Weak')
        .addOption('4', 'Medium')
        .addOption('5', 'Strong'),
    );

    this.knownOptions.set(
      'pause-after',
      new FixedOptions()
        .addOption('1', 'Default')
        .addOption('2', 'None')
        .addOption('3', 'Weak')
        .addOption('4', 'Medium')
        .addOption('5', 'Strong'),
    );

    this.knownOptions.set(
      'balance',
      new AutocompleteOptions()
        .addOption('Default')
        .addOption('Left')
        .addOption('Center')
        .addOption('Right')
        .addOption('Left-to-center')
        .addOption('Left-to-right')
        .addOption('Right-to-center')
        .addOption('Right-to-left')
        .addOption('Center-to-left')
        .addOption('Center-to-right')
        .addOption('Above')
        .addOption('Above-to-center')
        .addOption('Center-to-above')
        .addOption('Below')
        .addOption('Below-to-center')
        .addOption('Center-to-below'),
    );

    this.knownOptions.set(
      'effects',
      new AutocompleteOptions()
        .addOption('Default')
        .addOption('Subvocalized')
        .addOption('Memory')
        .addOption('Royal Canterlot Voice'),
    );
  }

  requestSelection(
    range,
    property,
    fixedOptionsModal,
    autocompleteModal,
    textFieldModal,
  ) {
    const options = this.knownOptions.get(property);
    if (!options) {
      return textFieldModal.api.requestSelection(range, property, options);
    } else if (options instanceof FixedOptions) {
      return fixedOptionsModal.api.requestSelection(range, property, options);
    } else if (options instanceof AutocompleteOptions) {
      return autocompleteModal.api.requestSelection(range, property, options);
    }

    throw ('Missing options for property', property);
  }
}

const createLabelSelectionModal = (useLabelingWindow) => {
  const useLabelSelectionModal = (hotkeyListener) => {
    const { api, internal, components } = synthComponent();

    internal.labelingWindow = useLabelingWindow(hotkeyListener);
    internal.selectionModal = useSelectionModal();

    internal.selectionModal.api.cancelSubscription.useSubscription(() => {
      internal.labelingWindow.api.cancelSelection();
    });

    api.requestSelection = (range, description, options) => {
      return new Promise((resolve, reject) => {
        const selectionPromise = internal.labelingWindow.api.requestSelection(
          description,
          options,
        );
        internal.selectionModal.api.showModal(range);
        selectionPromise
          .then((result) => {
            internal.selectionModal.api.hideModal();
            resolve(result);
          })
          .catch((error) => {
            internal.selectionModal.api.hideModal();
            reject(error);
          });
      });
    };

    const Display = () => {
      return (
        <internal.selectionModal.components.Display>
          <internal.labelingWindow.components.Display />
        </internal.selectionModal.components.Display>
      );
    };
    components.Display = Display;

    return { api, components };
  };

  return useLabelSelectionModal;
};

const useFixedOptionsSelectionModal = createLabelSelectionModal(
  useFixedOptionsWindow,
);
const useAutocompleteSelectionModal = createLabelSelectionModal(
  useAutocompleteWindow,
);
const useTextFieldSelectionModal = createLabelSelectionModal(useTextFieldWindow);

const ALLOWED_VALUES = new AllowedValues();

const getLabelHint = (property) => {
  return PROP_HINTS.get(property);
};

const KNOWN_DESCRIPTIONS = [
  new TemplateDescription(
    'meta element="narrator" character="?"',
    'Narrator',
  ),
  new TemplateDescription('spoken character="?"', 'Speaker'),
  new TemplateDescription(
    'spoken character="{character}"',
    'Speaker {character}',
  ),
  new TemplateDescription(
    'meta character="?" age="?" gender="?"',
    "Set a character's age, gender",
  ),
  new TemplateDescription('spoken emotion="?"', 'Emotion'),
  new TemplateDescription(
    'spoken emotion="{emotion}"',
    'Emotion {emotion}',
  ),
  new TemplateDescription(
    'meta character="{character}" emotion="?"',
    "Set {character}'s default emotion",
  ),
  new TemplateDescription(
    'meta character="?" emotion="?"',
    "Set a character's default emotion",
  ),
  new TemplateDescription(
    'tuned rate="?" stress="?" volume="?" pitch="?"',
    'Rate, stress, volume, pitch',
  ),
  new TemplateDescription(
    'meta character="?" rate="?" volume="?" pitch="?"',
    "Set a character's default rate, stress, volume, pitch",
  ),
  new TemplateDescription(
    'timed pause-before="?" pause-after="?"',
    'Pause before or after',
  ),
  new TemplateDescription(
    'positioned balance="?"',
    'Speech positioning',
  ),
  new TemplateDescription(
    'spoken-as pronunciation="?"',
    'Pronunciation',
  ),
  new TemplateDescription('ignored', "Ignore this line"),
  new TemplateDescription('voiced effects="?"', 'Sound effects'),
];

const getLabelDescription = (partialLabel) => {
  for (let knownDesc of KNOWN_DESCRIPTIONS) {
    const result = knownDesc.getDescription(partialLabel);
    if (result) {
      return result;
    }
  }

  return null;
};

const getParameterSetter = (partialLabel) => {
  // # get list of parameters
  // # figure out possible values for each parameter
  // # infer hotkey
  // # create a sequence of dialogs, one for each parameter
};

const SingleEnabledClipkey = ({ shortcut, action, description }) => {
  const { classes } = useContext(ThemeContext);
  const containerClassName = `${classes['o-keyboard-key']} ${classes['c-hotkey__container']}`;
  const descrClassName = classes['c-hotkey__description'];
  const shortcutClassName = `${classes['c-hotkey__shortcut']}`;

  return (
    <button className={containerClassName} onClick={action}>
        <span className={descrClassName} >
          {description}
        </span>
        <span className={shortcutClassName}>
          {shortcut}
        </span>
    </button>
  );
};

const SingleDisabledClipkey = ({ shortcut, restore, description }) => {
  const { classes } = useContext(ThemeContext);
  return (
    <div>
      <span
        className={`${classes['c-hotkey__paper']} ${classes['c-hotkey--disabled']}`}
      >{`${shortcut} | ${description}`}</span>
      <Button
        className={classes['c-hotkey__restore-button']}
        variant="outlined"
        size="small"
        color="primary"
        disabled="true"
        onClick={restore}
      >
        Restore
      </Button>
    </div>
  );
};

const useClipkeyPanel = (clipfics, hotkeySet) => {
  const { api, components, internal } = synthComponent();

  // const clipfics = useClipficsContext();
  internal.nextClipkeyIndex = 0;
  internal.enabledHotkeys = new Map(); // shortcut => { key, action, description }
  internal.disabledHotkeys = new Map(); // key => { shortcut, action, description }
  internal.subscription = synthSubscription();

  api.registerHotkey = (shortcut, action, description) => {
    if (internal.enabledHotkeys.has(shortcut)) {
      // unregister any previous associated action
      const {
        key: oldKey,
        action: oldAction,
        description: oldDescription,
      } = internal.enabledHotkeys.get(shortcut);

      clipfics.api.hotkeyListener.unregisterHotkey(hotkeySet, shortcut, oldAction);
      internal.disabledHotkeys.set(oldKey, {
        shortcut,
        action: oldAction,
        description: oldDescription,
      });
    }

    // register the new action
    const nextIndex = internal.nextClipkeyIndex++;
    internal.enabledHotkeys.set(shortcut, {
      key: nextIndex,
      action,
      description,
    });
    clipfics.api.hotkeyListener.registerHotkey(hotkeySet, shortcut, action);

    internal.subscription.broadcast();
  };

  api.restoreHotkey = (key) => {
    const { shortcut, action, description } = internal.disabledHotkeys.get(key);
    const {
      key: oldKey,
      action: oldAction,
      description: oldDescription,
    } = internal.enabledHotkeys.get(shortcut);

    clipfics.api.hotkeyListener.unregisterHotkey(hotkeySet, shortcut, oldAction);
    internal.disabledHotkeys.delete(key);
    internal.enabledHotkeys.set(shortcut, { key, action, description });
    internal.disabledHotkeys.set(oldKey, {
      shortcut,
      action: oldAction,
      description: oldDescription,
    });
    clipfics.api.hotkeyListener.registerHotkey(hotkeySet, shortcut, action);

    internal.subscription.broadcast();
  };

  api.clearHotkeys = () => {
    internal.nextClipkeyIndex = 0;

    Array.from(internal.enabledHotkeys.entries()).forEach(([shortcut, entry]) => {
      clipfics.api.hotkeyListener.unregisterHotkey(hotkeySet, shortcut, entry.action);
    });

    internal.enabledHotkeys.clear();
    internal.disabledHotkeys.clear();
  };

  const Display = () => {
    const { classes } = useContext(ThemeContext);
    const { forceUpdate } = useForceUpdateControl();

    internal.subscription.useSubscription(() => {
      forceUpdate();
    });

    return (
      <div className={classes['c-controls__hotkey-list']}>
        {Array.from(internal.enabledHotkeys.entries()).map(([shortcut, entry]) => {
          const { key, action, description } = entry;
          return (
            <SingleEnabledClipkey
              key={key}
              shortcut={shortcut}
              action={action}
              description={description}
            />
          );
        })}

        {Array.from(internal.disabledHotkeys.entries()).map(([key, entry]) => {
          const { shortcut, description } = entry;

          return (
            <SingleDisabledClipkey
              key={key}
              shortcut={shortcut}
              description={description}
              restore={() => api.restoreHotkey(key)}
            />
          );
        })}
      </div>
    );
  };
  components.Display = Display;

  api.internal = internal;

  return {
    components,
    api,
  };
};

const useNavigator = (clipfics) => {
  const { api, internal } = synthComponent();
  // const clipfics = useClipficsContext();

  internal.lastSelection = null;

  const selectNext = (getNextRange) => {
    let currentSelection = clipfics.api.selection.getRange();
    if (!currentSelection) {
      currentSelection =
        internal.lastSelection || clipfics.api.storyNavigator.getInitialRange();
    }

    const nextSelection = getNextRange(currentSelection);
    if (nextSelection) {
      internal.lastSelection = nextSelection;
      clipfics.api.selection.setRange(nextSelection);

      new RangeUtils(nextSelection).scrollIntoView();
    }
  };

  api.createSelectNextAction = (regex) => {
    return () =>
      selectNext((current) =>
        clipfics.api.storyNavigator.getNextPhrase(current, regex),
      );
  };

  api.createSelectPrevAction = (regex) => {
    return () =>
      selectNext((current) =>
        clipfics.api.storyNavigator.getPreviousPhrase(current, regex),
      );
  };

  return { api };
};

const getLabelWithHint = (missingProp) => {
  const hint = getLabelHint(missingProp);
  if (hint) {
    return `${missingProp} (${hint})`;
  }

  return missingProp;
};

const useLabeler = (clipfics) => {
  const { api, components, internal } = synthComponent();

  internal.requestPropsLoop = useForEachLoop().api;
  internal.selectionCache = useSelectionCache(clipfics.api.selection).api;
  internal.modifyLabelModal = useModal().api;

  internal.modifyLabelCallback = null;
  internal.originalLabel = null;

  internal.autocompleteModal = useAutocompleteSelectionModal();
  internal.fixedOptionsModal = useFixedOptionsSelectionModal(
    clipfics.api.hotkeyListener,
  );
  internal.textFieldModal = useTextFieldSelectionModal();

  api.lastLabel = '';

  api.labelSelection = (template) => {
    internal.selectionCache.saveSelection();
    const pendingLabel = new CookieSynthLabel(
      clipfics.api.selection.getRange(),
      template,
    );

    internal.requestPropsLoop
      .forEach(pendingLabel.missingTemplateProperties, (moveToNext) => {
        ALLOWED_VALUES.requestSelection(
          internal.selectionCache.savedRange,
          internal.requestPropsLoop.currentItem,
          internal.fixedOptionsModal,
          internal.autocompleteModal,
          internal.textFieldModal,
        )
          .then((value) => {
            pendingLabel.setNextValue(value);
            moveToNext();
          })
          .catch((error) => {
            internal.requestPropsLoop.terminate(error);
          });
      })
      .then(() => {
        const { terminal } = clipfics.api;
        if (pendingLabel.injectLabel(clipfics)) {
          api.lastLabel = pendingLabel.getCompletedLabel();
        } else {
          terminal.log('invalid label:', pendingLabel.completedLabel);
        }
        internal.selectionCache.restoreSelection();
      })
      .catch((error) => {
        internal.requestPropsLoop.terminate();
        internal.selectionCache.restoreSelection();
        if (error) {
          throw error;
        }
      });
  };

  const AddLabelModals = () => {
    // return (
    //   <React.Fragment>
    //     <internal.fixedOptionsModal.components.Display>
    //       <internal.fixedOptions.components.Display />
    //     </internal.fixedOptionsModal.components.Display>
    //     <internal.autocompleteModal.components.Display>
    //       <internal.autocomplete.components.Display />
    //     </internal.autocompleteModal.components.Display>
    //   </React.Fragment>
    // );
    return (
      <React.Fragment>
        <internal.fixedOptionsModal.components.Display />
        <internal.autocompleteModal.components.Display />
        <internal.textFieldModal.components.Display />
      </React.Fragment>
    );
  };
  components.AddLabelModals = AddLabelModals;

  return { api, components };
};

export default (clipfics) => {
  const { api, components } = synthComponent();
  const navigator = useNavigator(clipfics);
  const clipkeyPanel = useClipkeyPanel(clipfics, 'default');
  const labeler = useLabeler(clipfics);

  // create set of second-level modal options
  // create a single modal to display the second-level options
  // update the parameters of that modal depending on which one is presented

  api.clearHotkeys = clipkeyPanel.api.clearHotkeys;

  components.HotkeyDisplay = clipkeyPanel.components.Display;
  components.HotkeyModals = labeler.components.AddLabelModals;

  const addTemplatedLabel = (template) => () => {
    const selectionRange = clipfics.api.selection.getRange();
    if (!selectionRange) {
      clipfics.api.terminal.log('you need to select some story text first');
      return;
    }

    labeler.api.labelSelection(template);
  };

  api.createHotkey = (shortcut, action, description) => {
    clipkeyPanel.api.registerHotkey(shortcut, action, description);
  };

  api.createLabelHotkey = (shortcut, labelTemplate) => {
    const description = getLabelDescription(labelTemplate) || labelTemplate;
    api.createHotkey(shortcut, addTemplatedLabel(labelTemplate), description);
  };

  api.createRepeatLabelHotkey = (shortcut) => {
    api.createHotkey(
      shortcut,
      () => addTemplatedLabel(labeler.api.lastLabel)(),
      'Repeat the last label',
    );
  };

  api.createNextSelectionHotkey = (shortcut, regex, description) => {
    api.createHotkey(
      shortcut,
      navigator.api.createSelectNextAction(regex),
      description,
    );
  };

  api.createPrevSelectionHotkey = (shortcut, regex, description) => {
    api.createHotkey(
      shortcut,
      navigator.api.createSelectPrevAction(regex),
      description,
    );
  };

  return {
    api,
    components,
  };
};

const useCookieSynthLabeler = () => {
  const { api, components, internal } = synthComponent();

  api.registerHint = null;
  api.registerHotkey = null; // accepts either a template string or a function to call

  components.Panel = null;
  components.PromptModals = null;
};
