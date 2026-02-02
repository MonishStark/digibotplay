/**
 * Test data extracted from database snapshots (2026-02-01)
 * All user passwords: Qwerty@123
 *
 * @format
 */

export const testData = {
	// Users
	users: {
		admin1: {
			id: 69,
			username: "qwe",
			firstname: "TestFirstname",
			lastname: "qwe",
			email: "social.sloth.nwmz@protectsmail.net",
			phone: "+1",
			phoneNumber: "invalid-not-a-number",
			password: "Qwerty@123",
			companyId: 45,
			role: 1, // Admin role
		},
		admin2: {
			id: 70,
			username: "rere",
			firstname: "rerere",
			lastname: "rere",
			email: "social.sloth.iwmz@protectsmail.net",
			phone: "+1",
			phoneNumber: "(131) 231-2313",
			password: "Qwerty@123",
			companyId: 46,
			role: 1,
		},
		superAdmin: {
			id: 71,
			username: "dsdsd",
			firstname: "dsdsd",
			lastname: "dsdsd",
			email: "poised.reindeer.muxl@protectsmail.net",
			phone: "+1",
			phoneNumber: "(432) 423-4234",
			password: "Qwerty@123",
			companyId: 47,
			role: 4, // Super admin role
		},
	},

	// Companies
	companies: {
		company1: {
			id: 45,
			adminId: 69,
		},
		company2: {
			id: 46,
			adminId: 70,
		},
		company3: {
			id: 47,
			adminId: 71,
		},
	},

	// Teams
	teams: {
		team1: {
			id: 21,
			companyId: 45,
			creatorId: 69,
			teamName: "acc1team1",
			teamAlias: "12345",
			uuid: "1361f287-adf9-520b-a643-d4465003526d",
		},
		team2: {
			id: 22,
			companyId: 46,
			creatorId: 70,
			teamName: "acc2team1",
			teamAlias: "54321",
			uuid: "70266725-903e-3101-85b4-74e572d97fd8",
		},
		team3: {
			id: 23,
			companyId: 47,
			creatorId: 71,
			teamName: "admin1team1",
			teamAlias: "0909",
			uuid: "78e98fe9-33ea-56bf-88c0-c08ebc68a617",
		},
	},

	// Documents/Files
	documents: {
		rootFolder: {
			id: 4,
			parentId: null,
			teamId: null,
			name: "Root",
			type: "folder",
			isDefault: 1,
		},
		notesFolder1: {
			id: 351,
			parentId: 4,
			teamId: 21,
			name: "Notes",
			type: "folder",
			creatorId: 69,
		},
		acc1folder1: {
			id: 352,
			parentId: 4,
			teamId: 21,
			name: "acc1folder1",
			type: "folder",
			creatorId: 69,
		},
		chatgptPdf: {
			id: 353,
			parentId: 4,
			teamId: 21,
			name: "Chatgpt.pdf",
			size: 23.44, // kb
			type: "file",
			creatorId: 69,
			source: "Local uploads",
		},
		notesFolder2: {
			id: 354,
			parentId: 4,
			teamId: 22,
			name: "Notes",
			type: "folder",
			creatorId: 70,
		},
		acc2folder1: {
			id: 355,
			parentId: 4,
			teamId: 22,
			name: "acc2folder1",
			type: "folder",
			creatorId: 70,
		},
		notesFolder3: {
			id: 356,
			parentId: 4,
			teamId: 23,
			name: "Notes",
			type: "folder",
			creatorId: 71,
		},
		adminfolder1: {
			id: 357,
			parentId: 4,
			teamId: 23,
			name: "adminfolder1",
			type: "folder",
			creatorId: 71,
		},
	},

	// Chat data
	chats: {
		chat1: {
			id: 31,
			userId: 69,
			teamId: 21,
			name: "summary of it",
			scopeId: 1,
			scope: "file",
			resourceId: 353, // Chatgpt.pdf
		},
	},

	chatMessages: {
		message1: {
			id: 474,
			chatId: 31,
			message: "summary of it",
			role: "user",
		},
		message2: {
			id: 475,
			chatId: 31,
			message: "GitHub Copilot PR reviews continuously suggest cha...",
			role: "bot",
			parent: 474,
		},
	},

	// Notifications
	notifications: {
		notification1: {
			id: 4,
			userId: 69,
			message: "successfull",
			title: "Chatgpt.pdf (23.44kb)",
			objectId: 353,
			type: "file",
			isViewed: 0,
		},
	},

	// Summaries
	summaries: {
		summary1: {
			id: 19,
			field: 353,
			teamId: 21,
			fileName: "Chatgpt.pdf",
			notes: "Based on the provided text, here is a summary of t...",
		},
	},

	// File embeddings
	fileEmbeddings: {
		embedding1: {
			id: 8,
			field: 353,
			embeddingId: "1351f287-adf9-520b-a643-d4465003526d_353_C:\\Users\\...",
		},
		embedding2: {
			id: 9,
			field: 353,
			embeddingId: "1351f287-adf9-520b-a643-d4465003526d_353_C:\\Users\\...",
		},
		embedding3: {
			id: 10,
			field: 353,
			embeddingId: "1351f287-adf9-520b-a643-d4465003526d_353_unknown_c...",
		},
	},

	// File deletions
	fileDeletions: {
		deletion1: {
			id: 7,
			field: 353,
			uuid: "1351f287-adf9-520b-a643-d4465003526d",
			fileFullName: "353.pdf",
			notificationId: 4,
		},
	},

	// User tokens (refresh tokens - expires 2026-03-03)
	userTokens: {
		token1: {
			id: 7,
			userId: 69,
			refreshToken:
				"eyJhbGciOiJIUzI1NlsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OSIsImlzc0luUjVjQ0l6IkxwXVCJsJ9.eyJ1c2VySWQiOiI2OSIsImlzc0...",
			expiresAt: "2026-03-03 21:16:36",
		},
		token2: {
			id: 8,
			userId: 70,
			refreshToken:
				"eyJhbGciOiJIUzI1NlsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MCIsImlzc0luUjVjQ0l6IkxwXVCJsJ9.eyJ1c2VySWQiOiI3MCIsImlzc0...",
			expiresAt: "2026-03-03 21:19:49",
		},
		token3: {
			id: 10,
			userId: 71,
			refreshToken:
				"eyJhbGciOiJIUzI1NlsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MSIsImlzc0luUjVjQ0l6IkxwXVCJsJ9.eyJ1c2VySWQiOiI3MSIsImlzc0...",
			expiresAt: "2026-03-03 21:26:21",
		},
	},

	// User company role relationships
	userCompanyRoles: {
		relation1: {
			id: 67,
			userId: 69,
			company: 45,
			role: 1,
		},
		relation2: {
			id: 68,
			userId: 70,
			company: 46,
			role: 1,
		},
		relation3: {
			id: 69,
			userId: 71,
			company: 47,
			role: 4, // Super admin
		},
	},
};

/**
 * Helper to get user by role
 */
export function getUserByRole(role: "admin1" | "admin2" | "superAdmin") {
	return testData.users[role];
}

/**
 * Helper to get team for a user
 */
export function getTeamForUser(userId: number) {
	return Object.values(testData.teams).find(
		(team) => team.creatorId === userId,
	);
}

/**
 * Helper to get company for a user
 */
export function getCompanyForUser(userId: number) {
	return Object.values(testData.companies).find(
		(company) => company.adminId === userId,
	);
}
