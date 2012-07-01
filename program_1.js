ProgramController.loadProgram(
{
	// For testing, these will be reset by the client.
	// But they will be respected once there's a real server serving them.
	start:	"7 Apr 2012 15:00:00 EDT",
	now:	2400,

	blocks: [
		{
			start: 0, dll: false, dfe: false, msse: 0, mssl: 0, appt: false,
			items: [
				{duration: 300,  uri: "uri1", playlistUri: "playlist1", dll: false},
				{duration: 300,  uri: "uri2", playlistUri: "playlist1", dll: false},
				{duration: 60,   uri: "uri3", playlistUri: null,        dll: false}
			],
		},
		{
			start: 900, dll: false, dfe: false, msse: 120, mssl: 0, appt: false,
			items: [
				{duration: 480,  uri: "uri4", playlistUri: null,        dll: false},
				{duration: 300,  uri: "uri5", playlistUri: "playlist2", dll: false},
				{duration: 60,   uri: "uri6", playlistUri: "playlist2", dll: false}
			],
		},
		{
			start: 3600, dll: false, dfe: false, msse: 0, mssl: 0, appt: true,
			items: [
				{duration: 60,   uri: "uri7", playlistUri: null,        dll: false},
				{duration: 360,  uri: "uri8", playlistUri: null,        dll: false},
				{duration: 900,  uri: "uri9", playlistUri: null,        dll: false}
			],
		}
	]
}
);
