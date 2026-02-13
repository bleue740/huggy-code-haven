export { VirtualFS } from './VirtualFS';
export { ProjectContext } from './ProjectContext';
export {
  conversationReducer,
  INITIAL_CONVERSATION_STATE,
  isConversationActive,
  getPhaseLabel,
} from './ConversationStateMachine';
export type {
  ConversationPhase,
  ConversationState,
  ConversationAction,
} from './ConversationStateMachine';
