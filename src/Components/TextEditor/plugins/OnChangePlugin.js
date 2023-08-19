import { useEffect, useRef } from "react";
import { $getRoot } from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { getUserSave } from "../../../Utilities/userApi";
import { CLEAR_EDITOR_COMMAND } from "lexical";
const OnChangePlugin = ({ onChange, bookmarkID }) => {
  // Access the editor through the LexicalComposerContext
  const [editor] = useLexicalComposerContext();
  const isFirstRender = useRef(true);
  const emptyEditorState = JSON.stringify({"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}});

  useEffect(() => {
    const getNotesFromBookmark = async (bookmarkID) => {
      let shouldClearEditor = false;
      if(bookmarkID) {
        let save = await getUserSave(bookmarkID);
        let initialNotes = false;
        console.log(save);
        console.log(save.notes);
        console.log(save.notes.length);
        if(save.notes.length > 0)
          initialNotes = save.notes;

        console.log(bookmarkID);
        if(initialNotes !== false) {
          console.log(initialNotes);
          const editorStateJSON = initialNotes;
          const initialEditorState = editor.parseEditorState(editorStateJSON);
          editor.setEditorState(initialEditorState)
        } else {
          shouldClearEditor = true;
        }
      } else {
        shouldClearEditor = true;
      }

      if(shouldClearEditor) {
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
        console.log("clearEditor");
      }
    }
    
    getNotesFromBookmark(bookmarkID);

  }, [isFirstRender.current, bookmarkID, editor])

  // register listener for onChange
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      let editorStateObject = editor.getEditorState();
      onChange(editorStateObject.toJSON());
    });
  }, [editor, onChange]);

}

export default OnChangePlugin;