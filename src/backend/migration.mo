import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  // Copied data types from main.mo (for migration only).
  type KnowledgeDoc = {
    id : Text;
    title : Text;
    content : Text;
    createdAt : Int;
  };
  type DataRow = {
    id : Text;
    component : Text;
    specification : Text;
    toolsRequired : Text;
    createdAt : Int;
  };
  type ScanResult = {
    id : Text;
    timestamp : Int;
    contextMode : Text;
    analysisText : Text;
    thumbnailSummary : Text;
  };

  // From main.mo (for migration only)
  type OldActor = {
    knowledgeDocs : Map.Map<Principal, Map.Map<Text, KnowledgeDoc>>;
    dataRows : Map.Map<Principal, Map.Map<Text, DataRow>>;
    scanResults : Map.Map<Principal, Map.Map<Text, ScanResult>>;
    GEMINI_API_KEY : Text;
    GEMINI_ENDPOINT : Text;
  };
  type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    // Only update endpoints.
    {
      old with
      GEMINI_API_KEY = "AIzaSyB4px4mNuvUwtUdON97N0C-z4ZR6avtPb8";
      GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=" #
      "AIzaSyB4px4mNuvUwtUdON97N0C-z4ZR6avtPb8";
    };
  };
};
