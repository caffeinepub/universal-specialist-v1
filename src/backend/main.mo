import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import OutCall "http-outcalls/outcall";

actor {
  public type KnowledgeDoc = {
    id : Text;
    title : Text;
    content : Text;
    createdAt : Int;
  };

  public type DataRow = {
    id : Text;
    component : Text;
    specification : Text;
    toolsRequired : Text;
    createdAt : Int;
  };

  public type ScanResult = {
    id : Text;
    timestamp : Int;
    contextMode : Text;
    analysisText : Text;
    thumbnailSummary : Text;
  };

  public type SearchResult = {
    title : Text;
    snippet : Text;
    url : Text;
  };

  public type AgenticResult = {
    searchQuery : Text;
    results : [SearchResult];
    actionableSummary : Text;
    contextMode : Text;
    timestamp : Int;
  };

  // ── Admin / Owner ────────────────────────────────────────────────────────────
  // The Owner principal is permanently assigned as the admin for this canister.
  // Only this principal may call setGeminiApiKey.
  let ADMIN_PRINCIPAL : Principal = Principal.fromText("rgnf7-jhmxm-b3kih-sig4x-d7ynu-4w64f-nvuhp-wfuq7-sk5fh-b4knz-qqe");

  let knowledgeDocs = Map.empty<Principal, Map.Map<Text, KnowledgeDoc>>();
  let dataRows = Map.empty<Principal, Map.Map<Text, DataRow>>();
  let scanResults = Map.empty<Principal, Map.Map<Text, ScanResult>>();

  // Retained for upgrade compatibility with previous canister versions
  stable var GEMINI_API_KEY : Text = "";
  stable var GEMINI_ENDPOINT : Text = "";

  // Active vault variable — set via setGeminiApiKey from the Settings UI
  stable var geminiApiKey : Text = "AIzaSyAcs_gTJtZ_LZAC_gTMQ6Eyj3eY92PtTTI";

  // Permanently set to gemini-2.5-flash — do not revert to 1.5
  let GEMINI_MODEL : Text = "gemini-2.5-flash";

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ── API Key Vault ────────────────────────────────────────────────────────────

  // Only the admin principal (Owner) may update the Gemini API key.
  public shared ({ caller }) func setGeminiApiKey(key : Text) : async Text {
    if (caller != ADMIN_PRINCIPAL) {
      return "ERROR: Access denied. Only the Owner/Admin can set the API key.";
    };
    geminiApiKey := key;
    "SUCCESS: Key saved to secure canister memory.";
  };

  public query func hasGeminiKey() : async Bool {
    geminiApiKey != "";
  };

  // ── User data helpers ────────────────────────────────────────────────────────────

  func getOrCreateUser<K, V>(store : Map.Map<Principal, Map.Map<K, V>>, user : Principal) : Map.Map<K, V> {
    switch (store.get(user)) {
      case (?map) { map };
      case (null) {
        let newMap = Map.empty<K, V>();
        store.add(user, newMap);
        newMap;
      };
    };
  };

  public shared ({ caller }) func saveKnowledgeDoc(doc : KnowledgeDoc) : async () {
    let userDocs = getOrCreateUser(knowledgeDocs, caller);
    userDocs.add(doc.id, doc);
  };

  public shared ({ caller }) func deleteKnowledgeDoc(id : Text) : async () {
    switch (knowledgeDocs.get(caller)) {
      case (?userDocs) { userDocs.remove(id) };
      case (null) { Runtime.trap("No knowledge docs found for this user") };
    };
  };

  public query ({ caller }) func getKnowledgeDocs() : async [KnowledgeDoc] {
    switch (knowledgeDocs.get(caller)) {
      case (?userDocs) { userDocs.values().toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func saveDataRow(row : DataRow) : async () {
    let userRows = getOrCreateUser(dataRows, caller);
    userRows.add(row.id, row);
  };

  public shared ({ caller }) func deleteDataRow(id : Text) : async () {
    switch (dataRows.get(caller)) {
      case (?userRows) { userRows.remove(id) };
      case (null) { Runtime.trap("No data rows found for this user") };
    };
  };

  public query ({ caller }) func getDataRows() : async [DataRow] {
    switch (dataRows.get(caller)) {
      case (?userRows) { userRows.values().toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func whoami() : async Principal {
    caller;
  };

  public shared ({ caller }) func saveScanResult(result : ScanResult) : async () {
    let userResults = getOrCreateUser(scanResults, caller);
    userResults.add(result.id, result);
  };

  public shared ({ caller }) func deleteScanResult(id : Text) : async () {
    switch (scanResults.get(caller)) {
      case (?userResults) { userResults.remove(id) };
      case (null) { Runtime.trap("No scan results found for this user") };
    };
  };

  public query ({ caller }) func getScanResults() : async [ScanResult] {
    switch (scanResults.get(caller)) {
      case (?userResults) { userResults.values().toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func webSearch(_query : Text) : async [SearchResult] {
    [
      {
        title = "DuckDuckGo Search Requires TypeScript/JavaScript Client";
        snippet = "DuckDuckGo's API returns complex JSON. Use frontend TS with fetch() for HTTP outcall and JSON deserialization.";
        url = "https://api.duckduckgo.com";
      },
    ];
  };

  func jsonEscape(input : Text) : Text {
    let iter = input.chars().flatMap(
      func(char) {
        switch (char) {
          case ('\\') { "\\\\".chars() };
          case ('\"') { "\\\"".chars() };
          case ('\n') { "\\n".chars() };
          case ('\r') { "\\r".chars() };
          case ('\t') { "\\t".chars() };
          case (_) { Text.fromChar(char).chars() };
        };
      }
    );
    Text.fromIter(iter);
  };

  func parseGeminiResponse(body : Text) : Text {
    body;
  };

  public shared ({ caller }) func visionScan(imageBase64 : Text, _prompt : Text, _contextMode : Text) : async Text {
    if (geminiApiKey == "") {
      return "GEMINI API ERROR: API key not configured. Please set it in Settings.";
    };
    // Permanently uses gemini-2.5-flash via v1beta/generateContent
    let endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" # GEMINI_MODEL # ":generateContent?key=" # geminiApiKey;
    let safePrompt = jsonEscape(_prompt);
    let safeImage = jsonEscape(imageBase64);

    let jsonBody = "{\"contents\":[{\"parts\":[{\"text\":\"" # safePrompt # "\"},{\"inline_data\":{\"mime_type\":\"image/jpeg\",\"data\":\"" # safeImage # "\"}}]}]}";
    let headers : [OutCall.Header] = [{ name = "Content-Type"; value = "application/json" }];

    try {
      let rawBody = await OutCall.httpPostRequest(endpoint, headers, jsonBody, transform);
      parseGeminiResponse(rawBody);
    } catch (e) {
      let safeError = jsonEscape(e.message());
      "{\"error\":\"Vision scan failed: " # safeError # "\"}";
    };
  };

  func getSectorKeywords(mode : Text) : Text {
    switch (mode) {
      case ("healthcare") { "clinical protocol medical diagnosis treatment standard" };
      case ("healthcare-human-services") { "clinical protocol medical diagnosis treatment standard" };
      case ("technology") { "technical specification API documentation engineering" };
      case ("digital-technology") { "technical specification API documentation engineering" };
      case ("education") { "curriculum learning standard academic compliance" };
      case ("construction") { "OSHA safety code structural specification building standard" };
      case ("mechanics") { "repair manual torque spec OEM diagnostic procedure" };
      case ("advanced-manufacturing") { "repair manual torque spec OEM diagnostic procedure" };
      case ("supply-chain-transportation") { "logistics fleet compliance DOT freight operations" };
      case ("energy-natural-resources") { "power systems sustainability extraction compliance" };
      case ("agriculture") { "crop science equipment irrigation food systems" };
      case ("public-service-safety") { "emergency response NFPA law enforcement civil safety" };
      case ("marketing-sales") { "brand strategy analytics customer engagement retail" };
      case ("management-entrepreneurship") { "operations strategy business development KPI" };
      case ("financial-services") { "accounting investment compliance regulatory finance" };
      case ("arts-entertainment-design") { "creative production UX media design standards" };
      case ("hospitality-events-tourism") { "event operations guest experience venue compliance" };
      case (_) { "technical specification reference manual" };
    };
  };

  public shared ({ caller }) func agenticScan(imageDescription : Text, contextMode : Text) : async AgenticResult {
    let keywords = getSectorKeywords(contextMode);
    {
      searchQuery = "Missing_implementation: Use " # keywords # " with OpenAI backend for contextual search";
      results = [{
        title = "Missing_implementation - browser.fetch() enables universal web search";
        snippet = "Add more search engines beyond DuckDuckGo. Use browser fetch() for limitless search.";
        url = "https://motoko-search-agent-ai/";
      }];
      actionableSummary = imageDescription # "\nContext mode: " # contextMode;
      contextMode;
      timestamp = 0;
    };
  };
};
