import React, { useContext } from 'react';
import { Button } from '@material-ui/core';
import { ThemeContext } from 'theme.js';

/**
 * Button to load a story file into the StorySheet.
 */
export default ({ onFileLoaded }) => {
  const { classes } = useContext(ThemeContext);

  const handleFileSelected = (event) => {
    const reader = new FileReader();
    reader.onload = (e) => onFileLoaded(e.target.result);
    reader.readAsText(event.target.files[0]);
  };

  return (
    <span>
      <input
        id="c-raised-button-file"
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
      <label htmlFor="c-raised-button-file">
        <Button
          variant="contained"
          component="span"
          className={classes['c-fileio-import-button']}
        >
          Load story
        </Button>
      </label>
    </span>
  );
};
