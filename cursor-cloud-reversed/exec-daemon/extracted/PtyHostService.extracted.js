const PtyHostService = {
    typeName: "agent.v1.PtyHostService",
    methods: {
        /**
         * Spawns a new PTY instance
         *
         * @generated from rpc agent.v1.PtyHostService.SpawnPty
         */
        spawnPty: {
            name: "SpawnPty",
            I: pty_host_service_pb/* SpawnPtyRequest */.MR,
            O: pty_host_service_pb/* SpawnPtyResponse */.SW,
            kind: MethodKind.Unary,
        },
        /**
         * Attaches to an existing PTY instance and streams its output
         *
         * @generated from rpc agent.v1.PtyHostService.AttachPty
         */
        attachPty: {
            name: "AttachPty",
            I: pty_host_service_pb/* AttachPtyRequest */.st,
            O: pty_host_service_pb/* PtyEvent */.G,
            kind: MethodKind.ServerStreaming,
        },
        /**
         * Sends input to a PTY instance
         *
         * @generated from rpc agent.v1.PtyHostService.SendInput
         */
        sendInput: {
            name: "SendInput",
            I: pty_host_service_pb/* SendInputRequest */.ss,
            O: pty_host_service_pb/* SendInputResponse */.E_,
            kind: MethodKind.Unary,
        },
        /**
         * Resizes a PTY instance
         *
         * @generated from rpc agent.v1.PtyHostService.ResizePty
         */
        resizePty: {
            name: "ResizePty",
            I: pty_host_service_pb/* ResizePtyRequest */.Bk,
            O: pty_host_service_pb/* ResizePtyResponse */.Jz,
            kind: MethodKind.Unary,
        },
        /**
         * Lists all active PTY instances
         *
         * @generated from rpc agent.v1.PtyHostService.ListPtys
         */
        listPtys: {
            name: "ListPtys",
            I: pty_host_service_pb/* ListPtysRequest */.e7,
            O: pty_host_service_pb/* ListPtysResponse */.iB,
            kind: MethodKind.Unary,
        },
        /**
         * Terminates a PTY instance
         *
         * @generated from rpc agent.v1.PtyHostService.TerminatePty
         */
        terminatePty: {
            name: "TerminatePty",
            I: pty_host_service_pb/* TerminatePtyRequest */._q,
            O: pty_host_service_pb/* TerminatePtyResponse */.cL,
            kind: MethodKind.Unary,
        },
    }
};