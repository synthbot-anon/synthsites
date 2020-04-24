import React, { useContext } from 'react';
import { Button } from '@material-ui/core';
import { ThemeContext } from 'theme.js';

/**
 * Button to load a story file into the StorySheet.
 */
export default ({ onFilesLoaded }) => {
  const { classes } = useContext(ThemeContext);

  const handleFileSelected = ({ target }) => {
    onFilesLoaded(target.files);   
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
