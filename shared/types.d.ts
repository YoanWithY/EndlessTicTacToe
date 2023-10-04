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
    playerCount: number,
    /**
     * How many chips a player can place before it is the next player's turn.
     */
    movesPerTurn: number,
    /**
     * How many chips a player must have in a row to count as winning.
     */
    winCondition: number
};
type res_newGame = {
    /**
     * The game ID.
     */
    gameID: number;
}

type ws_close_reason = "serverIsFull"
type ws_player_shape = "none" | "square" | "square_filled" | "circle" | "circle_filled" | "triangle" | "triangle_filled" | "cross";
type ws_color = 0 | 1 | 2 | 3 | 4 | 5;
type ws_player_data = { name: string, color: ws_color, shape: ws_player_shape, playerNumber: number, isPlayerRead: boolean };
type ws_command = "getAllPlayerData" | "connectAsPlayer" | "connectionRejected" | "connectionRequest" | "updatePlayerData";
type ettt = { command: ws_command };
type ws_req_connection = ettt & {
    command: "connectionRequest";
}
type ws_res_connection_as_player = ettt & {
    command: "connectAsPlayer";
    playerData: ws_player_data[];
    playerNumber: number;
};
type ws_close_connection_reject = ws_close_reason & "serverIsFull";
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