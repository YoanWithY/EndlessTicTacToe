type req_doesGameExist = {
    /**
     * The gameID to check for.
     */
    gameID: number
};
type res_doesGameExist = {
    /**
     * Wheter the game exists or not.
     */
    exists: boolean;
};
type req_newGame = {
    /**
     * The exact number of players for the game.
     */
    playerCount: ws_player_count,
    /**
     * How many chips a player can place before it is the next player's turn.
     */
    movesPerTurn: ws_move_in_row,
    /**
     * How many chips a player must have in a row to count as winning.
     */
    winCondition: ws_cnfw
};
type res_newGame = {
    /**
     * The game ID.
     */
    gameID: number;
}
type ws_chip = { x: number, y: number, owner: number };
type ws_close_reason = "serverIsFull"
type ws_player_shape = "none" | "square" | "square_filled" | "circle" | "circle_filled" | "triangle" | "triangle_filled" | "cross";
type ws_player_count = 2 | 3 | 4 | 5 | 6 | 7;
type ws_color = 0 | 1 | 2 | 3 | 4 | 5;
type ws_cnfw = 4 | 5 | 6 | 7;
type ws_move_in_row = 1 | 2 | 3 | 4;
type ws_player_data = { name: string, color: ws_color, shape: ws_player_shape, playerNumber: number, isPlayerRead: boolean };
type ws_command = "getAllPlayerData" | "connectAsPlayer" | "connectionRejected" |
    "connectionRequest" | "updatePlayerData" | "playerReady" | "startGame" | "newChip" | "ping" | "pong";
type ettt = { command: ws_command };
type ws_req_connection = ettt & {
    command: "connectionRequest";
}
type ws_res_connection_as_player = ettt & {
    command: "connectAsPlayer";
    playerData: ws_player_data[];
    playerNumber: number;
    cdfw: ws_cnfw;
    movesInRow: ws_move_in_row;
};
type ws_ping = ettt & {
    command: "ping";
}
type ws_pong = ettt & {
    command: "pong";
}
/**
 * Indicates that the player ready state has changed.
 */
type ws_req_player_ready = ettt & {
    command: "playerReady";
}
type ws_req_new_chip = ettt & {
    command: "newChip";
    chip: ws_chip;
}
type ws_res_new_chip = ettt & {
    command: "newChip";
    chip: ws_chip;
}
type ws_close_connection_reject = ws_close_reason & "serverIsFull";
/**
 * Indicates that the game should start.
 */
type ws_start_game = ettt & {
    command: "startGame";
};
type ws_req_update_player_data = ettt & {
    command: "updatePlayerData";
    player: ws_player_data;
}
type ws_res_update_player_data = ettt & {
    command: "updatePlayerData";
    player: ws_player_data;
}