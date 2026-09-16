const ExecService = {
    typeName: "agent.v1.ExecService",
    methods: {
        /**
         * @generated from rpc agent.v1.ExecService.Exec
         */
        exec: {
            name: "Exec",
            I: exec_pb/* ExecServerMessage */.Ye,
            O: ExecStreamElement,
            kind: MethodKind.ServerStreaming,
        },
        /**
         * Trusted daemon filesystem access with no text/image transformations.
         *
         * @generated from rpc agent.v1.ExecService.ReadFile
         */
        readFile: {
            name: "ReadFile",
            I: ReadFileRequest,
            O: ReadFileResponse,
            kind: MethodKind.ServerStreaming,
        },
    }
};