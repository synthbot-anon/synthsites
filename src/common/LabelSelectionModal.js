const LabelSelectionModal = ({ open, onComplete, onEscape, ...other }) => {
  const { hotkeys, selection } = useContext(ClipficsContext);
  const { classes } = useContext(ThemeContext);

  const [savedRange, setSavedRange] = useState(null);

  const openLabelDialog = () => {
    const selectionRange = selection.getRange();

    if (!selectionRange) {
      return;
    }

    setSavedRange(selectionRange);
    setShowLabelModal(true);
  };

  const escapeLabelDialog = () => {
    selection.setRange(savedRange);
    onEscape();
  };

  const finishLabelDialog = (text) => {
    selection.setRange(savedRange);
    onComplete(text, savedRange);
  };

  return (

      <Modal open={showLabelModal} onClose={escapeLabelDialog}>
        <div className={classes['c-labelmodal__container']}>
          <CompletableTextField
            label="Add label"
            className={classes['c-labelmodal__textfield']}
            autoFocus
            onComplete={finishLabelDialog}
          />
        </div>
      </Modal>
    </div>
  );
};