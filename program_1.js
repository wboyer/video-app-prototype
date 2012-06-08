ProgramController.loadProgram(
{
	// For testing, these will be reset by the client.
	// But they will be respected once there's a real server serving them.
	start:	"7 Apr 2012 15:00:00 EDT",
	now:	2400,

	blocks: [
		{
			start: 0, dsl: false, dfe: true,
			items: [
				{duration: 120,  uri: "uri1", config: "a=b", dsl: false, dfe: true},
				{duration: 120,  uri: "uri2", config: "a=b", dsl: false, dfe: true},
				{duration: 60,   uri: "uri3", config: "",    dsl: false, dfe: true}
			],
		},
		{
			start: 900, dsl: false, dfe: true,
			items: [
				{duration: 180,  uri: "uri4", config: "c=d", dsl: false, dfe: true},
				{duration: 180,  uri: "uri5", config: "",    dsl: false, dfe: true},
				{duration: 60,   uri: "uri6", config: "e=f", dsl: true,  dfe: true}
			],
		},
		{
			start: 3600, dsl: false, dfe: true,
			items: [
				{duration: 1800, uri: "uri7", config: "",    dsl: false, dfe: true},
				{duration: 120,  uri: "uri8", config: "",    dsl: false, dfe: true},
				{duration: 900,  uri: "uri9", config: "",    dsl: false, dfe: true}
			],
		}
	]
}
);
