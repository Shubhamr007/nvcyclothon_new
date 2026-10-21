import React from 'react';
import PropTypes from 'prop-types';
import { AiSuggestionsPanel } from './AiSuggestionsPanel';

export const QuickPromptsCarousel = React.memo(function QuickPromptsCarousel({
  onSelectPrompt,
  disabled = false,
}) {
  return (
    <AiSuggestionsPanel
      onInsertPrompt={onSelectPrompt}
      disabled={disabled}
    />
  );
});

QuickPromptsCarousel.propTypes = {
  onSelectPrompt: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default QuickPromptsCarousel;

