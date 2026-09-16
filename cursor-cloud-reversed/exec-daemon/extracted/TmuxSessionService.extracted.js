const TmuxSessionService = {
    typeName: "agent.v1.TmuxSessionService",
    methods: {
        /**
         * @generated from rpc agent.v1.TmuxSessionService.CreateSession
         */
        createSession: {
            name: "CreateSession",
            I: tmux_session_service_pb/* CreateTmuxSessionRequest */.uL,
            O: tmux_session_service_pb/* CreateTmuxSessionResponse */.Cd,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.TmuxSessionService.ListSessions
         */
        listSessions: {
            name: "ListSessions",
            I: tmux_session_service_pb/* ListTmuxSessionsRequest */.fq,
            O: tmux_session_service_pb/* ListTmuxSessionsResponse */.nx,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.TmuxSessionService.KillSession
         */
        killSession: {
            name: "KillSession",
            I: tmux_session_service_pb/* KillTmuxSessionRequest */.GP,
            O: tmux_session_service_pb/* KillTmuxSessionResponse */.su,
            kind: MethodKind.Unary,
        },
        /**
         * @generated from rpc agent.v1.TmuxSessionService.AttachSession
         */
        attachSession: {
            name: "AttachSession",
            I: tmux_session_service_pb/* AttachTmuxSessionRequest */.Lw,
            O: tmux_session_service_pb/* AttachTmuxSessionResponse */.rt,
            kind: MethodKind.Unary,
        },
    }
};